"use client";

import React, { useRef } from "react";
import { Button } from "@heroui/button";
import { Download, FileText } from "lucide-react";

import { ChatMarkdown } from "./ChatMarkdown";

import {
  downloadText,
  exportDocx,
  exportPdf,
  safeFilename,
} from "@/lib/chat/exportDoc";

interface DocInput {
  title: string;
  format: "markdown" | "latex";
  content: string;
}

// Renders a create_document tool call: in-chat document preview with
// PDF / DOCX / source export buttons. Rendered from the tool *input*.
export const ChatDocument: React.FC<{ input: DocInput }> = ({ input }) => {
  const bodyRef = useRef<HTMLDivElement>(null);

  if (!input?.content) return null;
  const isLatex = input.format === "latex";

  const handlePdf = () => {
    // Print the rendered markdown (with KaTeX math); for LaTeX source we
    // print the raw source listing.
    const html = isLatex
      ? `<pre>${input.content
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")}</pre>`
      : bodyRef.current?.innerHTML || "";

    exportPdf(input.title, html);
  };

  return (
    <div className="min-w-0">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <FileText className="h-4 w-4 text-[var(--fqxi-ink-muted)]" />
        <span className="mr-auto text-sm font-semibold text-[var(--fqxi-ink)]">
          {input.title}
        </span>
        <Button size="sm" variant="flat" onPress={handlePdf}>
          <Download className="h-3.5 w-3.5" /> PDF
        </Button>
        {!isLatex && (
          <Button
            size="sm"
            variant="flat"
            onPress={() => exportDocx(input.title, input.content)}
          >
            <Download className="h-3.5 w-3.5" /> DOCX
          </Button>
        )}
        <Button
          size="sm"
          variant="flat"
          onPress={() =>
            downloadText(
              `${safeFilename(input.title)}.${isLatex ? "tex" : "md"}`,
              input.content,
            )
          }
        >
          <Download className="h-3.5 w-3.5" /> {isLatex ? ".tex" : ".md"}
        </Button>
      </div>

      <div className="max-h-[480px] overflow-y-auto rounded-lg border border-[var(--fqxi-border)] bg-[var(--fqxi-paper)] p-5 chat-scroll">
        {isLatex ? (
          <pre className="whitespace-pre-wrap break-words text-xs text-[var(--fqxi-ink)]">
            {input.content}
          </pre>
        ) : (
          <div ref={bodyRef}>
            <ChatMarkdown>{input.content}</ChatMarkdown>
          </div>
        )}
      </div>
    </div>
  );
};
