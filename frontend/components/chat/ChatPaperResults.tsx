"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const PREVIEW_COUNT = 6;

// Compact paper cards rendered from a search_papers tool result. No inner
// scroll area — shows the top results with an expand toggle for the rest.
export const ChatPaperResults: React.FC<{ output: any }> = ({ output }) => {
  const [expanded, setExpanded] = useState(false);

  if (!output) return null;
  if (output.note && (!output.papers || output.papers.length === 0)) {
    return <p className="text-sm text-[var(--fqxi-ink-muted)]">{output.note}</p>;
  }

  const papers: any[] = output.papers || [];
  const visible = expanded ? papers : papers.slice(0, PREVIEW_COUNT);
  const hidden = papers.length - PREVIEW_COUNT;

  return (
    <div className="min-w-0 space-y-2">
      <div className="text-xs text-[var(--fqxi-ink-muted)]">
        {output.total_found} papers found · showing {papers.length}
        {output.sources_used?.length ? ` · ${output.sources_used.join(", ")}` : ""}
        {output.sort ? ` · sorted by ${output.sort}` : ""}
      </div>

      <div className="space-y-1.5">
        {visible.map((p: any) => (
          <div
            key={p.i}
            className="min-w-0 rounded-lg border border-[var(--fqxi-border)] bg-[var(--fqxi-paper)] px-3 py-2 transition-colors hover:border-[var(--fqxi-yellow)]"
          >
            <div className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0 text-xs font-bold text-[var(--fqxi-ink-muted)]">
                [{p.i}]
              </span>
              <div className="min-w-0">
                {p.link ? (
                  <a
                    className="text-sm font-medium leading-snug text-[var(--fqxi-ink)] underline decoration-transparent underline-offset-2 transition-colors hover:decoration-[var(--fqxi-yellow)]"
                    href={p.link}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {p.title}
                  </a>
                ) : (
                  <span className="text-sm font-medium leading-snug text-[var(--fqxi-ink)]">
                    {p.title}
                  </span>
                )}
                <div className="mt-0.5 truncate text-xs text-[var(--fqxi-ink-muted)]">
                  {p.authors}
                  {p.year ? ` · ${p.year}` : ""}
                  {p.citations ? ` · ${p.citations} citations` : ""}
                  {p.venue ? ` · ${p.venue}` : ""}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {hidden > 0 && (
        <button
          className="flex items-center gap-1 text-xs font-medium text-[var(--fqxi-ink-muted)] transition-colors hover:text-[var(--fqxi-ink)]"
          type="button"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3.5 w-3.5" /> Show fewer
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5" /> Show {hidden} more
            </>
          )}
        </button>
      )}
    </div>
  );
};
