"use client";

import React from "react";
import { Layers } from "lucide-react";

// Same palette as the citation NetworkGraph so themes look consistent across the app.
const CLUSTER_COLORS = [
  "#6366f1", "#06b6d4", "#10b981", "#f59e0b", "#ec4899",
  "#8b5cf6", "#ef4444", "#14b8a6", "#a855f7", "#84cc16",
];

interface Cluster {
  id: number;
  label_terms?: string[];
  size: number;
  share_pct?: number;
  avg_citations?: number;
  year_range?: [number, number] | null;
  representative_papers?: string[];
}

const themeTitle = (terms?: string[]): string =>
  (terms || [])
    .slice(0, 3)
    .map((t) => t.charAt(0).toUpperCase() + t.slice(1))
    .join(" · ") || "Theme";

const ThemeClusters: React.FC<{ clusters?: Cluster[] }> = ({ clusters }) => {
  if (!clusters || clusters.length === 0) return null;

  return (
    <div className="mb-8">
      <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[var(--fqxi-ink)]">
        <Layers className="h-5 w-5" />
        Research Themes
        <span className="text-sm font-normal text-[var(--fqxi-ink-muted)]">
          ({clusters.length} clusters)
        </span>
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {clusters.map((c) => {
          const color = CLUSTER_COLORS[c.id % CLUSTER_COLORS.length];
          const years =
            c.year_range && c.year_range[0]
              ? `${c.year_range[0]}–${c.year_range[1]}`
              : null;

          return (
            <div
              key={c.id}
              className="rounded-xl border border-[var(--fqxi-border)] bg-[var(--fqxi-paper-soft)] p-4"
              style={{ borderLeft: `4px solid ${color}` }}
            >
              <div className="mb-1 flex items-center gap-2">
                <span
                  className="inline-block h-3 w-3 flex-shrink-0 rounded-full"
                  style={{ background: color }}
                />
                <h4 className="font-semibold text-[var(--fqxi-ink)] leading-tight">
                  {themeTitle(c.label_terms)}
                </h4>
              </div>

              <p className="mb-3 text-xs text-[var(--fqxi-ink-muted)]">
                {c.size} papers
                {typeof c.share_pct === "number" ? ` · ${c.share_pct}%` : ""}
                {typeof c.avg_citations === "number"
                  ? ` · avg ${c.avg_citations} citations`
                  : ""}
                {years ? ` · ${years}` : ""}
              </p>

              {c.representative_papers && c.representative_papers.length > 0 && (
                <ul className="space-y-1">
                  {c.representative_papers.slice(0, 3).map((title, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-1.5 text-xs text-[var(--fqxi-ink-muted)]"
                    >
                      <span
                        className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full"
                        style={{ background: color }}
                      />
                      <span className="line-clamp-2">{title}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ThemeClusters;
