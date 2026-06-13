// Client-side document export for chat-created documents.
// PDF: open a print-ready window with the rendered HTML (browser's native
// print-to-PDF gives selectable text and correct KaTeX math — far better
// fidelity than canvas-based PDF generation).
// DOCX: the `docx` package + a pragmatic markdown subset parser (headings,
// lists, code fences, bold/italic/inline-code). Math stays as TeX source.
// `docx` is imported dynamically inside exportDocx(): it's a large class-heavy
// library only needed on export click, and keeping it out of the page bundle
// avoids bundler downleveling issues with its ESM build.

export function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadText(filename: string, content: string): void {
  downloadBlob(filename, new Blob([content], { type: "text/plain;charset=utf-8" }));
}

export function safeFilename(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "document"
  );
}

// --- PDF (print window) -----------------------------------------------------

export function exportPdf(title: string, contentHtml: string): void {
  const win = window.open("", "_blank", "width=900,height=1100");

  if (!win) return;

  win.document.write(`<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.21/dist/katex.min.css" />
<style>
  body {
    font-family: Georgia, "Times New Roman", serif;
    color: #1d1d1b;
    max-width: 46rem;
    margin: 2.5rem auto;
    padding: 0 1.5rem;
    line-height: 1.65;
  }
  h1, h2, h3, h4 { line-height: 1.25; }
  h1 { font-size: 1.7rem; border-bottom: 1px solid #ddd; padding-bottom: .3rem; }
  pre { background: #f6f5ef; border: 1px solid #ddd; border-radius: 8px; padding: .8em 1em; overflow-x: auto; font-size: .85em; }
  code { font-family: Menlo, monospace; font-size: .9em; }
  table { border-collapse: collapse; width: 100%; font-size: .92em; }
  th, td { border: 1px solid #ccc; padding: .4em .7em; text-align: left; }
  th { background: #f4f1df; }
  blockquote { border-left: 3px solid #e4d344; margin: .7em 0; padding-left: .9em; color: #555; }
  a { color: #1d1d1b; }
  @media print { body { margin: 0 auto; } }
</style>
</head>
<body>
<h1>${escapeHtml(title)}</h1>
${contentHtml}
<script>window.onload = () => setTimeout(() => window.print(), 350);</script>
</body>
</html>`);
  win.document.close();
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// --- DOCX (markdown subset) -------------------------------------------------

type Docx = typeof import("docx");

// Inline markdown (**bold**, *italic*, `code`) → docx TextRuns.
function inlineRuns(docx: Docx, text: string): InstanceType<Docx["TextRun"]>[] {
  const { TextRun } = docx;
  const runs: InstanceType<Docx["TextRun"]>[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let last = 0;
  let m: RegExpExecArray | null;

  while ((m = re.exec(text)) !== null) {
    if (m.index > last) runs.push(new TextRun(text.slice(last, m.index)));
    const tok = m[0];

    if (tok.startsWith("**")) {
      runs.push(new TextRun({ text: tok.slice(2, -2), bold: true }));
    } else if (tok.startsWith("`")) {
      runs.push(new TextRun({ text: tok.slice(1, -1), font: "Courier New" }));
    } else {
      runs.push(new TextRun({ text: tok.slice(1, -1), italics: true }));
    }
    last = m.index + tok.length;
  }
  if (last < text.length) runs.push(new TextRun(text.slice(last)));

  return runs.length ? runs : [new TextRun("")];
}

export async function exportDocx(title: string, markdown: string): Promise<void> {
  const docx = await import("docx");
  const { AlignmentType, Document, HeadingLevel, Packer, Paragraph, TextRun } =
    docx;

  const HEADINGS: Record<
    number,
    (typeof HeadingLevel)[keyof typeof HeadingLevel]
  > = {
    1: HeadingLevel.HEADING_1,
    2: HeadingLevel.HEADING_2,
    3: HeadingLevel.HEADING_3,
    4: HeadingLevel.HEADING_4,
  };

  const paragraphs: InstanceType<Docx["Paragraph"]>[] = [
    new Paragraph({ text: title, heading: HeadingLevel.TITLE, alignment: AlignmentType.LEFT }),
  ];

  const lines = markdown.split("\n");
  let inCode = false;
  let codeBuf: string[] = [];

  for (const raw of lines) {
    const line = raw.replace(/\r$/, "");

    if (line.trim().startsWith("```")) {
      if (inCode) {
        for (const cl of codeBuf) {
          paragraphs.push(
            new Paragraph({
              children: [new TextRun({ text: cl || " ", font: "Courier New", size: 18 })],
            }),
          );
        }
        codeBuf = [];
      }
      inCode = !inCode;
      continue;
    }
    if (inCode) {
      codeBuf.push(line);
      continue;
    }

    const h = line.match(/^(#{1,4})\s+(.*)$/);

    if (h) {
      paragraphs.push(
        new Paragraph({ children: inlineRuns(docx, h[2]), heading: HEADINGS[h[1].length] }),
      );
      continue;
    }

    const bullet = line.match(/^\s*[-*+]\s+(.*)$/);

    if (bullet) {
      paragraphs.push(
        new Paragraph({ children: inlineRuns(docx, bullet[1]), bullet: { level: 0 } }),
      );
      continue;
    }

    const numbered = line.match(/^\s*\d+[.)]\s+(.*)$/);

    if (numbered) {
      paragraphs.push(
        new Paragraph({
          children: inlineRuns(docx, numbered[1]),
          numbering: { reference: "num", level: 0 },
        }),
      );
      continue;
    }

    if (line.trim() === "" || /^\s*(-{3,}|\*{3,})\s*$/.test(line)) {
      paragraphs.push(new Paragraph({ text: "" }));
      continue;
    }

    paragraphs.push(new Paragraph({ children: inlineRuns(docx, line) }));
  }

  const doc = new Document({
    numbering: {
      config: [
        {
          reference: "num",
          levels: [
            {
              level: 0,
              format: "decimal",
              text: "%1.",
              alignment: AlignmentType.LEFT,
            },
          ],
        },
      ],
    },
    sections: [{ children: paragraphs }],
  });

  const blob = await Packer.toBlob(doc);

  downloadBlob(`${safeFilename(title)}.docx`, blob);
}
