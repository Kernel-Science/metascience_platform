"use client";

import React, { useMemo, useState } from "react";
import Graph from "react-graph-vis";

import "vis-network/styles/vis-network.css";

// Same palettes as the main NetworkGraph so the chat graph reads identically.
const CLUSTER_COLORS = [
  "#6366f1", "#06b6d4", "#10b981", "#f59e0b", "#ec4899",
  "#8b5cf6", "#ef4444", "#14b8a6", "#a855f7", "#84cc16",
];
const ROLE_COLORS: Record<string, string> = {
  seed: "#6366f1",
  cited: "#8b5cf6",
  citing: "#06b6d4",
  other: "#10b981",
};
const ROLE_LABELS: Record<string, string> = {
  seed: "Seed paper",
  cited: "Referenced",
  citing: "Citing",
  other: "Other",
};

type ColorMode = "theme" | "role";

const clusterColor = (cluster: number) =>
  cluster == null || cluster < 0
    ? "#94a3b8"
    : CLUSTER_COLORS[cluster % CLUSTER_COLORS.length];

const nodeColor = (n: any, mode: ColorMode) =>
  mode === "role"
    ? ROLE_COLORS[n.isSeed ? "seed" : n.type] || ROLE_COLORS.other
    : clusterColor(n.cluster);

// Lightweight, store-free citation graph for chat messages, with the same
// Theme/Role color toggle as the main citation view.
export const ChatNetworkGraph: React.FC<{ output: any }> = ({ output }) => {
  const [colorBy, setColorBy] = useState<ColorMode>("theme");

  const graph = useMemo(() => {
    const nodes = (output?.nodes || []).map((n: any) => {
      const bg = nodeColor(n, colorBy);

      return {
        id: n.id,
        label:
          n.label && n.label.length > 22 ? `${n.label.slice(0, 22)}…` : n.label,
        title: `${n.title || ""}${n.year ? ` (${n.year})` : ""} — ${n.citations} citations`,
        shape: n.isSeed ? "star" : "dot",
        size: n.isSeed ? 24 : Math.min(30, 12 + Math.sqrt((n.citations || 0) + 1) * 1.5),
        color: {
          background: bg,
          border: n.isSeed ? "#111827" : bg,
          highlight: { background: bg, border: "#ffffff" },
        },
        borderWidth: n.isSeed ? 3 : 2,
        font: { size: 11, color: "#374151", strokeWidth: 2, strokeColor: "#ffffff" },
      };
    });
    const edges = (output?.edges || []).map((e: any, i: number) => ({
      id: `e${i}`,
      from: e.from,
      to: e.to,
      arrows: { to: { enabled: true, scaleFactor: 0.4 } },
      color: { color: "#cbd5e1", opacity: 0.6 },
      width: 1,
    }));

    return { nodes, edges };
  }, [output, colorBy]);

  const clusters: any[] = output?.clusters || [];
  const roles = useMemo(() => {
    const present = new Set<string>();

    for (const n of output?.nodes || []) {
      present.add(n.isSeed ? "seed" : ROLE_COLORS[n.type] ? n.type : "other");
    }

    return ["seed", "cited", "citing", "other"].filter((r) => present.has(r));
  }, [output]);

  if (!output?.nodes?.length) {
    return (
      <p className="text-sm text-[var(--fqxi-ink-muted)]">No network nodes returned.</p>
    );
  }

  return (
    <div className="min-w-0 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-auto text-xs text-[var(--fqxi-ink-muted)]">
          {output.node_count} papers · {output.edge_count} citation links ·{" "}
          {output.seed_count} seeds (★)
        </span>
        <div className="flex overflow-hidden rounded-lg border border-[var(--fqxi-border)] text-xs">
          {(["theme", "role"] as ColorMode[]).map((mode) => (
            <button
              key={mode}
              className={`px-2.5 py-1 capitalize transition-colors ${
                colorBy === mode
                  ? "bg-[var(--fqxi-yellow)] font-semibold text-[#1d1d1b]"
                  : "bg-[var(--fqxi-paper)] text-[var(--fqxi-ink-muted)] hover:text-[var(--fqxi-ink)]"
              }`}
              type="button"
              onClick={() => setColorBy(mode)}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[420px] w-full overflow-hidden rounded-lg border border-[var(--fqxi-border)] bg-white">
        <Graph
          key={colorBy}
          graph={graph}
          options={{
            physics: {
              solver: "forceAtlas2Based",
              forceAtlas2Based: { gravitationalConstant: -40, springLength: 110 },
              stabilization: { iterations: 150 },
            },
            interaction: { hover: true, tooltipDelay: 120 },
            layout: { improvedLayout: true },
          }}
        />
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
        {colorBy === "theme"
          ? clusters.map((c: any) => (
              <span
                key={c.id}
                className="inline-flex items-center gap-1 text-[var(--fqxi-ink-muted)]"
              >
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ background: clusterColor(c.id) }}
                />
                {(c.label_terms || []).slice(0, 3).join(" · ") || `Theme ${c.id}`}
              </span>
            ))
          : roles.map((r) => (
              <span
                key={r}
                className="inline-flex items-center gap-1 text-[var(--fqxi-ink-muted)]"
              >
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ background: ROLE_COLORS[r] }}
                />
                {ROLE_LABELS[r]}
              </span>
            ))}
      </div>
    </div>
  );
};
