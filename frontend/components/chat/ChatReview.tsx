"use client";

import React from "react";
import { Progress } from "@heroui/progress";

import { ChatMarkdown } from "./ChatMarkdown";

const LABELS: Record<string, string> = {
  formal_correctness: "Formal correctness",
  reproducibility: "Reproducibility",
  impact: "Impact",
  novelty: "Novelty",
  writing_clarity: "Clarity",
  writing_grammar: "Grammar",
  writing_fairness: "Fairness",
  interdisciplinarity: "Interdisciplinarity",
};

// Review scorecard rendered from a review_paper tool result in chat.
export const ChatReview: React.FC<{ output: any }> = ({ output }) => {
  if (!output) return null;
  if (output.error) {
    return <p className="text-sm text-danger">{output.error}</p>;
  }

  const scores = output.scores || {};

  return (
    <div className="space-y-4">
      <div>
        <div className="text-sm font-semibold text-[var(--fqxi-ink)]">
          {output.paper || output.arxiv_id}
        </div>
        <div className="text-xs text-[var(--fqxi-ink-muted)]">
          {output.paper_type ? `${output.paper_type} · ` : ""}
          arXiv:{output.arxiv_id}
          {output.confidence != null ? ` · reviewer confidence ${output.confidence}/10` : ""}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
        {Object.entries(LABELS).map(([key, label]) => {
          const s = scores[key];

          if (!s || s.value == null) return null;

          return (
            <div key={key}>
              <div className="flex justify-between text-xs text-[var(--fqxi-ink-muted)]">
                <span>{label}</span>
                <span className="font-medium text-[var(--fqxi-ink)]">
                  {s.value}/{s.max}
                </span>
              </div>
              <Progress
                aria-label={label}
                className="mt-0.5"
                color={s.value / s.max >= 0.7 ? "success" : s.value / s.max >= 0.45 ? "warning" : "danger"}
                size="sm"
                value={(s.value / s.max) * 100}
              />
            </div>
          );
        })}
      </div>

      {output.review_text && (
        <details className="rounded-lg border border-[var(--fqxi-border)] bg-[var(--fqxi-paper)] px-3 py-2">
          <summary className="cursor-pointer text-sm font-medium text-[var(--fqxi-ink)]">
            Full written review
          </summary>
          <div className="mt-2">
            <ChatMarkdown>{output.review_text}</ChatMarkdown>
          </div>
        </details>
      )}
    </div>
  );
};
