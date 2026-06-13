"use client";

import React from "react";

import ThemeClusters from "@/components/charts/ThemeClusters";

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <div>
    <h4 className="mb-1 text-sm font-semibold text-[var(--fqxi-ink)]">{title}</h4>
    <div className="text-sm text-[var(--fqxi-ink-muted)]">{children}</div>
  </div>
);

const List: React.FC<{ items?: string[] }> = ({ items }) =>
  items && items.length > 0 ? (
    <ul className="list-disc space-y-1 pl-5">
      {items.map((t, i) => (
        <li key={i}>{t}</li>
      ))}
    </ul>
  ) : null;

// Trend analysis rendered from an analyze_trends tool result in chat:
// theme cluster cards (shared component) + the grounded synthesis.
export const ChatTrends: React.FC<{ output: any }> = ({ output }) => {
  if (!output) return null;
  if (output.error) {
    return <p className="text-sm text-danger">{output.error}</p>;
  }

  const ai = output.ai_analysis || {};
  const stats = output.statistics || {};

  return (
    <div className="space-y-4">
      <div className="text-xs text-[var(--fqxi-ink-muted)]">
        {output.paper_count} papers
        {stats.year_range?.min ? ` · ${stats.year_range.min}–${stats.year_range.max}` : ""}
        {stats.avg_citations != null ? ` · avg ${stats.avg_citations} citations` : ""}
        {stats.max_citations != null ? ` · max ${stats.max_citations}` : ""}
      </div>

      <ThemeClusters clusters={output.themes} />

      {ai.research_evolution && (
        <Section title="Research evolution">{ai.research_evolution}</Section>
      )}
      {ai.emerging_trends?.length > 0 && (
        <Section title="Emerging trends">
          <List items={ai.emerging_trends} />
        </Section>
      )}
      {ai.notable_findings?.length > 0 && (
        <Section title="Notable findings">
          <List items={ai.notable_findings} />
        </Section>
      )}
      {ai.high_impact_areas && (
        <Section title="High-impact areas">{ai.high_impact_areas}</Section>
      )}
      {ai.future_directions?.length > 0 && (
        <Section title="Future directions">
          <List items={ai.future_directions} />
        </Section>
      )}
    </div>
  );
};
