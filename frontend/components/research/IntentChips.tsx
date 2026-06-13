"use client";

import React from "react";
import { Chip } from "@heroui/chip";

// How the executed search was interpreted, shown back as editable tags.
// Query terms (topics/phrases) are read-only context; refinements (dates,
// excludes, categories, authors, min-citations, sort) are removable/tweakable
// and each edit re-runs the search with the modified intent.

interface IntentChipsProps {
  intent: any;
  onChangeAction: (newIntent: any) => void;
  disabled?: boolean;
}

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "relevance", label: "Relevance" },
  { value: "hybrid", label: "Relevance + impact" },
  { value: "citations", label: "Most cited" },
  { value: "date", label: "Newest" },
];

export const IntentChips: React.FC<IntentChipsProps> = ({
  intent,
  onChangeAction,
  disabled,
}) => {
  if (!intent) return null;

  const update = (patch: Record<string, any>) =>
    onChangeAction({ ...intent, ...patch });

  const removeFromList = (key: string, value: string) =>
    update({ [key]: (intent[key] || []).filter((v: string) => v !== value) });

  // Read-only "what you searched for" terms.
  const queryTerms: string[] = [
    ...(intent.topics || []),
    ...(intent.phrases || []).map((p: string) => `"${p}"`),
  ];

  // Removable refinement chips: [label, onClose].
  const refinements: { key: string; label: string; color: any; onClose: () => void }[] = [];

  (intent.must_include || []).forEach((t: string) =>
    refinements.push({
      key: `must-${t}`,
      label: `+ ${t}`,
      color: "success",
      onClose: () => removeFromList("must_include", t),
    }),
  );
  (intent.should_include || []).forEach((t: string) =>
    refinements.push({
      key: `should-${t}`,
      label: `~ ${t}`,
      color: "default",
      onClose: () => removeFromList("should_include", t),
    }),
  );
  (intent.exclude || []).forEach((t: string) =>
    refinements.push({
      key: `exclude-${t}`,
      label: `− ${t}`,
      color: "danger",
      onClose: () => removeFromList("exclude", t),
    }),
  );
  (intent.authors || []).forEach((a: string) =>
    refinements.push({
      key: `author-${a}`,
      label: `author: ${a}`,
      color: "secondary",
      onClose: () => removeFromList("authors", a),
    }),
  );
  (intent.arxiv_categories || []).forEach((c: string) =>
    refinements.push({
      key: `cat-${c}`,
      label: c,
      color: "primary",
      onClose: () => removeFromList("arxiv_categories", c),
    }),
  );
  if (intent.field)
    refinements.push({
      key: "field",
      label: `field: ${String(intent.field).replace(/_/g, " ")}`,
      color: "primary",
      onClose: () => update({ field: null }),
    });
  if (intent.date_from)
    refinements.push({
      key: "date-from",
      label: `from ${intent.date_from}`,
      color: "warning",
      onClose: () => update({ date_from: null }),
    });
  if (intent.date_to)
    refinements.push({
      key: "date-to",
      label: `to ${intent.date_to}`,
      color: "warning",
      onClose: () => update({ date_to: null }),
    });
  if (intent.min_citations)
    refinements.push({
      key: "min-cit",
      label: `≥ ${intent.min_citations} citations`,
      color: "warning",
      onClose: () => update({ min_citations: null }),
    });
  if (intent.open_access_only)
    refinements.push({
      key: "oa",
      label: "open access",
      color: "success",
      onClose: () => update({ open_access_only: false }),
    });

  return (
    <div className="rounded-xl border border-[var(--fqxi-border)] bg-[var(--fqxi-paper)]/60 p-4 mb-6">
      <div className="flex flex-col gap-3">
        {/* Query terms (read-only) + sort selector */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-[var(--fqxi-ink-muted)] mr-1">
            Interpreted as
          </span>
          {queryTerms.length > 0 ? (
            queryTerms.map((t) => (
              <Chip key={`term-${t}`} color="primary" variant="flat" size="sm">
                {t}
              </Chip>
            ))
          ) : (
            <Chip color="default" variant="flat" size="sm">
              {intent.canonical_query || "all results"}
            </Chip>
          )}

          <span className="ml-auto flex items-center gap-2">
            <span className="text-xs text-[var(--fqxi-ink-muted)]">Sort</span>
            <select
              aria-label="Sort results"
              className="rounded-lg border border-[var(--fqxi-border)] bg-[var(--fqxi-paper)] px-2 py-1 text-sm text-[var(--fqxi-ink)] outline-none focus:border-[var(--fqxi-yellow)]"
              disabled={disabled}
              value={intent.sort || "relevance"}
              onChange={(e) => update({ sort: e.target.value })}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </span>
        </div>

        {/* Removable refinements */}
        {refinements.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {refinements.map((r) => (
              <Chip
                key={r.key}
                color={r.color}
                variant="flat"
                size="sm"
                onClose={disabled ? undefined : r.onClose}
              >
                {r.label}
              </Chip>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
