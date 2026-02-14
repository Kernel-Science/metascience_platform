"use client";

import React from "react";
import { Brain, TrendingUp, Users, Calendar } from "lucide-react";

interface AIInsightsProps {
  data?: {
    emerging_trends?: string[];
    key_research_themes?: string[];
    notable_findings?: string[];
    research_evolution?: string;
    high_impact_areas?: string;
    future_directions?: string[];
    fallback_mode?: boolean;
    error?: string;
  };
}

// Validate and sanitize array data
const sanitizeArray = (arr: any): string[] => {
  if (!Array.isArray(arr)) return [];
  return arr.filter((item) => typeof item === "string" && item.length > 0);
};

// Validate and sanitize string data
const sanitizeString = (str: any): string => {
  if (typeof str === "string") return str;
  return "";
};

const AIInsights: React.FC<AIInsightsProps> = ({ data }) => {
  // Sanitize all incoming data to prevent rendering issues
  const sanitizedData = data
    ? {
        emerging_trends: sanitizeArray(data.emerging_trends),
        key_research_themes: sanitizeArray(data.key_research_themes),
        notable_findings: sanitizeArray(data.notable_findings),
        research_evolution: sanitizeString(data.research_evolution),
        high_impact_areas: sanitizeString(data.high_impact_areas),
        future_directions: sanitizeArray(data.future_directions),
        fallback_mode: data.fallback_mode || false,
        error: data.error || "",
      }
    : null;

  if (!sanitizedData) {
    return (
      <div className="rounded-2xl border border-[var(--fqxi-border)] bg-[var(--fqxi-paper-soft)] p-6">
        <div className="flex items-center mb-4">
          <Brain className="mr-2 h-5 w-5 text-[var(--fqxi-ink-muted)]" />
          <h3 className="text-lg font-semibold text-[var(--fqxi-ink-muted)]">
            AI Analysis
          </h3>
        </div>
        <p className="text-[var(--fqxi-ink-muted)]">
          No AI insights available. Run analysis to generate insights.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--fqxi-border)] bg-[var(--fqxi-paper-soft)] p-6">
      <div className="flex items-center mb-4">
        <Brain className="mr-2 h-5 w-5 text-[var(--fqxi-ink)]" />
        <h3 className="text-lg font-semibold text-[var(--fqxi-ink)]">
          AI-Powered Insights
        </h3>
      </div>

      {sanitizedData.research_evolution && (
        <div className="mb-6 rounded-lg border border-[var(--fqxi-border)] bg-[var(--fqxi-paper)] p-4">
          <h4 className="mb-2 font-medium text-[var(--fqxi-ink)]">
            Research Evolution
          </h4>
          <p className="text-sm leading-relaxed text-[var(--fqxi-ink-muted)]">
            {sanitizedData.research_evolution}
          </p>
        </div>
      )}

      <div className="space-y-4">
        {sanitizedData.emerging_trends.length > 0 && (
          <div>
            <div className="flex items-center mb-2">
              <TrendingUp className="mr-2 h-4 w-4 text-[var(--fqxi-ink)]" />
              <h4 className="font-medium text-[var(--fqxi-ink)]">
                Emerging Trends
              </h4>
            </div>
            <ul className="space-y-1">
              {sanitizedData.emerging_trends.map((trend, index) => (
                <li
                  key={index}
                  className="flex items-start text-sm text-[var(--fqxi-ink-muted)]"
                >
                  <span className="mt-2 mr-2 h-2 w-2 flex-shrink-0 rounded-full bg-[var(--fqxi-yellow)]" />
                  {trend}
                </li>
              ))}
            </ul>
          </div>
        )}

        {sanitizedData.key_research_themes.length > 0 && (
          <div>
            <div className="flex items-center mb-2">
              <Calendar className="mr-2 h-4 w-4 text-[var(--fqxi-ink)]" />
              <h4 className="font-medium text-[var(--fqxi-ink)]">
                Key Research Themes
              </h4>
            </div>
            <ul className="space-y-1">
              {sanitizedData.key_research_themes.map((theme, index) => (
                <li
                  key={index}
                  className="flex items-start text-sm text-[var(--fqxi-ink-muted)]"
                >
                  <span className="mt-2 mr-2 h-2 w-2 flex-shrink-0 rounded-full bg-[var(--fqxi-yellow)]" />
                  {theme}
                </li>
              ))}
            </ul>
          </div>
        )}

        {sanitizedData.notable_findings.length > 0 && (
          <div>
            <div className="flex items-center mb-2">
              <Users className="mr-2 h-4 w-4 text-[var(--fqxi-ink)]" />
              <h4 className="font-medium text-[var(--fqxi-ink)]">
                Notable Findings
              </h4>
            </div>
            <ul className="space-y-1">
              {sanitizedData.notable_findings.map((finding, index) => (
                <li
                  key={index}
                  className="flex items-start text-sm text-[var(--fqxi-ink-muted)]"
                >
                  <span className="mt-2 mr-2 h-2 w-2 flex-shrink-0 rounded-full bg-[var(--fqxi-yellow)]" />
                  {finding}
                </li>
              ))}
            </ul>
          </div>
        )}

        {sanitizedData.high_impact_areas && (
          <div className="mb-6 rounded-lg border border-[var(--fqxi-border)] bg-[var(--fqxi-paper)] p-4">
            <h4 className="mb-2 font-medium text-[var(--fqxi-ink)]">
              High Impact Areas
            </h4>
            <p className="text-sm leading-relaxed text-[var(--fqxi-ink-muted)]">
              {sanitizedData.high_impact_areas}
            </p>
          </div>
        )}

        {sanitizedData.future_directions.length > 0 && (
          <div>
            <div className="flex items-center mb-2">
              <Brain className="mr-2 h-4 w-4 text-[var(--fqxi-ink)]" />
              <h4 className="font-medium text-[var(--fqxi-ink)]">
                Future Directions
              </h4>
            </div>
            <ul className="space-y-1">
              {sanitizedData.future_directions.map((direction, index) => (
                <li
                  key={index}
                  className="flex items-start text-sm text-[var(--fqxi-ink-muted)]"
                >
                  <span className="mt-2 mr-2 h-2 w-2 flex-shrink-0 rounded-full bg-[var(--fqxi-yellow)]" />
                  {direction}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIInsights;
