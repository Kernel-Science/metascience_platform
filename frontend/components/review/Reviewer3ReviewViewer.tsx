"use client";

// Split-view review reader replicating the Reviewer3 product: comments on
// the left, the actual paper on the right, click a comment to scroll to and
// highlight the passage it cites.
//
// IMPORTANT: import this component only via next/dynamic with ssr:false —
// pdf.js touches browser-only APIs (DOMMatrix) at module scope.

import React from "react";
import { Chip } from "@heroui/chip";
import { Spinner } from "@heroui/spinner";
import { Document, Page, pdfjs } from "react-pdf";
import type { PDFDocumentProxy } from "pdfjs-dist";

import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";

import { Reviewer3Comment } from "@/lib/reviewStore";
import { CommentCard, SEVERITY_CHIPS } from "./reviewer3Shared";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

const MAX_PAGE_WIDTH = 900;

// --- citation matching ------------------------------------------------------
// PDF text extraction is noisy (ligatures, hyphenation at line breaks, odd
// whitespace), so both the page text and the cited text are aggressively
// normalized, and the final comparison ignores spaces entirely.

function normalizeForMatch(s: string): string {
  return s
    .replace(/­/g, "") // soft hyphens
    .replace(/ﬁ/g, "fi")
    .replace(/ﬂ/g, "fl")
    .replace(/ﬃ/g, "ffi")
    .replace(/ﬄ/g, "ffl")
    .replace(/ﬀ/g, "ff")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/-\s*\n/g, "") // re-join words hyphenated across line breaks
    .replace(/[-–—]/g, " ") // remaining dashes compare as spaces
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

const despace = (s: string) => s.replace(/ /g, "");

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** 1-based page number containing the citation, or null if not found. */
function locateCitation(
  citedText: string,
  despacedPageTexts: string[],
): number | null {
  const cit = normalizeForMatch(citedText);
  if (!cit) return null;
  const words = cit.split(" ");
  // Full citation first, then shorter prefixes to tolerate extraction noise.
  const candidates = [
    cit,
    words.slice(0, 8).join(" "),
    words.slice(0, 5).join(" "),
  ]
    .map(despace)
    .filter((c) => c.length >= 12);

  for (const candidate of candidates) {
    for (let p = 0; p < despacedPageTexts.length; p++) {
      if (despacedPageTexts[p].includes(candidate)) return p + 1;
    }
  }
  return null;
}

// --- component ---------------------------------------------------------------

interface Reviewer3ReviewViewerProps {
  pdfUrl: string;
  comments: Reviewer3Comment[];
}

export function Reviewer3ReviewViewer({
  pdfUrl,
  comments,
}: Reviewer3ReviewViewerProps) {
  const [numPages, setNumPages] = React.useState(0);
  const [despacedPageTexts, setDespacedPageTexts] = React.useState<string[]>(
    [],
  );
  const [activeIdx, setActiveIdx] = React.useState<number | null>(null);
  const [severityFilter, setSeverityFilter] = React.useState<Set<number>>(
    new Set(),
  );
  const [pageWidth, setPageWidth] = React.useState(700);

  const paneRef = React.useRef<HTMLDivElement | null>(null);
  const pageRefs = React.useRef<(HTMLDivElement | null)[]>([]);

  // Fit pages to the pane width.
  React.useEffect(() => {
    const pane = paneRef.current;
    if (!pane) return;
    const observer = new ResizeObserver(([entry]) => {
      setPageWidth(
        Math.max(280, Math.min(MAX_PAGE_WIDTH, entry.contentRect.width - 32)),
      );
    });
    observer.observe(pane);
    return () => observer.disconnect();
  }, []);

  // Extract and normalize the text of every page once per document.
  const onDocumentLoad = React.useCallback(async (pdf: PDFDocumentProxy) => {
    setNumPages(pdf.numPages);
    const texts: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const raw = content.items
        .map((item) => {
          const it = item as { str?: string; hasEOL?: boolean };
          return (it.str ?? "") + (it.hasEOL ? "\n" : " ");
        })
        .join("");
      texts.push(despace(normalizeForMatch(raw)));
    }
    setDespacedPageTexts(texts);
  }, []);

  // Where each comment's citation lives (1-based page or null).
  const locations = React.useMemo(
    () =>
      comments.map((c) =>
        c.cited_text && despacedPageTexts.length > 0
          ? locateCitation(c.cited_text, despacedPageTexts)
          : null,
      ),
    [comments, despacedPageTexts],
  );

  const active = activeIdx != null ? comments[activeIdx] : null;
  const activePage = activeIdx != null ? locations[activeIdx] : null;
  const activeCitation = active?.cited_text
    ? despace(normalizeForMatch(active.cited_text))
    : null;

  // Highlight: on the located page, mark every text-layer fragment whose
  // normalized text is a piece of the active citation. pdf.js splits lines
  // into many small items, so substring containment reconstructs the passage.
  const textRenderer = React.useCallback(
    (textItem: { str: string }) => {
      const str = textItem.str;
      const safe = escapeHtml(str);
      if (!activeCitation) return safe;
      const fragment = despace(normalizeForMatch(str));
      if (fragment.length >= 4 && activeCitation.includes(fragment)) {
        return `<mark class="r3-mark r3-mark-${active?.severity ?? 0}">${safe}</mark>`;
      }
      return safe;
    },
    [activeCitation, active?.severity],
  );

  const handleSelect = (idx: number) => {
    setActiveIdx(idx);
    const page = locations[idx];
    if (page) {
      pageRefs.current[page - 1]?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      // Once the text layer re-renders with marks, center the passage.
      setTimeout(() => {
        const mark = pageRefs.current[page - 1]?.querySelector(".r3-mark");
        mark?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 700);
    }
  };

  const toggleSeverity = (sev: number) => {
    setSeverityFilter((prev) => {
      const next = new Set(prev);
      if (next.has(sev)) next.delete(sev);
      else next.add(sev);
      return next;
    });
  };

  const severityCounts = comments.reduce<Record<number, number>>((acc, c) => {
    if (c.severity) acc[c.severity] = (acc[c.severity] || 0) + 1;
    return acc;
  }, {});

  // Critical first; Reviewer3's rank field is currently always 0, so
  // severity is the only meaningful ordering.
  const ordered = comments
    .map((comment, idx) => ({ comment, idx }))
    .sort((a, b) => (a.comment.severity ?? 99) - (b.comment.severity ?? 99))
    .filter(
      ({ comment }) =>
        severityFilter.size === 0 ||
        (comment.severity != null && severityFilter.has(comment.severity)),
    );

  const indexing = numPages > 0 && despacedPageTexts.length === 0;

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:h-[calc(100vh-10rem)]">
      {/* Comments rail */}
      <div className="w-full lg:w-96 shrink-0 flex flex-col gap-3 lg:overflow-y-auto pr-1">
        <div className="flex items-center gap-2 flex-wrap">
          {([1, 2, 3, 4] as const).map(
            (sev) =>
              severityCounts[sev] > 0 && (
                <Chip
                  key={sev}
                  size="sm"
                  className="cursor-pointer"
                  color={SEVERITY_CHIPS[sev].color}
                  variant={
                    severityFilter.size === 0 || severityFilter.has(sev)
                      ? "flat"
                      : "bordered"
                  }
                  onClick={() => toggleSeverity(sev)}
                >
                  {severityCounts[sev]} {SEVERITY_CHIPS[sev].label}
                </Chip>
              ),
          )}
          {indexing && (
            <span className="text-xs text-muted-foreground">
              indexing paper…
            </span>
          )}
        </div>

        <div className="space-y-3">
          {ordered.map(({ comment, idx }) => (
            <CommentCard
              key={`${comment.reviewer_id}-${idx}`}
              comment={comment}
              active={idx === activeIdx}
              located={
                comment.cited_text && despacedPageTexts.length > 0
                  ? locations[idx] != null
                  : undefined
              }
              onSelect={() => handleSelect(idx)}
            />
          ))}
        </div>
      </div>

      {/* Paper pane */}
      <div
        ref={paneRef}
        className="flex-1 min-h-[60vh] lg:min-h-0 overflow-y-auto rounded-lg bg-content2 border border-divider/40"
      >
        <Document
          file={pdfUrl}
          onLoadSuccess={onDocumentLoad}
          loading={
            <div className="flex items-center justify-center py-20">
              <Spinner color="secondary" />
            </div>
          }
          error={
            <p className="text-sm text-danger text-center py-10">
              Could not render the PDF.
            </p>
          }
        >
          {Array.from({ length: numPages }, (_, i) => (
            <div
              key={i}
              ref={(el) => {
                pageRefs.current[i] = el;
              }}
              className="flex justify-center py-2"
            >
              <Page
                pageNumber={i + 1}
                width={pageWidth}
                renderAnnotationLayer={false}
                customTextRenderer={
                  activePage === i + 1 ? textRenderer : undefined
                }
              />
            </div>
          ))}
        </Document>
      </div>
    </div>
  );
}
