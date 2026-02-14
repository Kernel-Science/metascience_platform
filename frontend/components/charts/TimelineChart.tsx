"use client";

import React from "react";

interface TimelineData {
  year: number;
  papers: number;
  citations: number;
}

interface TimelineChartProps {
  data: TimelineData[];
}

const TimelineChart: React.FC<TimelineChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <p className="text-[var(--fqxi-ink-muted)]">
        No timeline data available.
      </p>
    );
  }

  // Validate and clean the data
  const cleanData = data.filter(
    (d) =>
      d &&
      typeof d === "object" &&
      "year" in d &&
      "papers" in d &&
      "citations" in d &&
      !isNaN(d.year) &&
      !isNaN(d.papers) &&
      !isNaN(d.citations) &&
      d.year > 0,
  );

  if (cleanData.length === 0) {
    return (
      <p className="text-[var(--fqxi-ink-muted)]">
        No valid timeline data available.
      </p>
    );
  }

  // Safe calculations with fallbacks
  const maxPapers = Math.max(...cleanData.map((d) => d.papers), 1); // Ensure at least 1 to avoid division by zero
  const maxCitations = Math.max(...cleanData.map((d) => d.citations), 1);
  const minYear = Math.min(...cleanData.map((d) => d.year));
  const maxYear = Math.max(...cleanData.map((d) => d.year));

  // Ensure we have a valid year range
  const yearRange = Math.max(maxYear - minYear, 1); // Ensure at least 1 to avoid division by zero
  const papersColor = "var(--fqxi-ink)";
  const citationsColor = "#e4d344";
  const gridColor = "var(--fqxi-border)";
  const textColor = "var(--fqxi-ink-muted)";

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold text-[var(--fqxi-ink)]">
          Timeline Analysis
        </h4>
        <div className="flex space-x-4 text-sm text-[var(--fqxi-ink-muted)]">
          <div className="flex items-center space-x-2">
            <div className="h-3 w-3 rounded-full bg-[#1d1d1b] dark:bg-[#f3f2ec]" />
            <span>Papers</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="h-3 w-3 rounded-full bg-[#e4d344]" />
            <span>Citations</span>
          </div>
        </div>
      </div>

      <div className="relative h-64 rounded-lg border border-[var(--fqxi-border)] bg-[var(--fqxi-paper-soft)] p-4">
        <svg className="w-full h-full" viewBox="0 0 800 200">
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((y) => (
            <line
              key={y}
              stroke={gridColor}
              strokeWidth="1"
              x1="50"
              x2="750"
              y1={y * 1.5 + 25}
              y2={y * 1.5 + 25}
            />
          ))}

          {/* Y-axis labels */}
          <text
            className="text-xs"
            fill={textColor}
            textAnchor="middle"
            x="20"
            y="30"
          >
            High
          </text>
          <text
            className="text-xs"
            fill={textColor}
            textAnchor="middle"
            x="20"
            y="100"
          >
            Med
          </text>
          <text
            className="text-xs"
            fill={textColor}
            textAnchor="middle"
            x="20"
            y="170"
          >
            Low
          </text>

          {/* Data points and lines */}
          {cleanData.map((point, index) => {
            // Safe calculations with proper validation
            const x = 50 + ((point.year - minYear) / yearRange) * 700;
            const papersY = 175 - (point.papers / maxPapers) * 150;
            const citationsY = 175 - (point.citations / maxCitations) * 150;

            // Validate calculated values
            const safeX = isNaN(x) ? 50 : x;
            const safePapersY = isNaN(papersY) ? 175 : papersY;
            const safeCitationsY = isNaN(citationsY) ? 175 : citationsY;

            const nextPoint = cleanData[index + 1];

            return (
              <g key={point.year}>
                {/* Lines to next point */}
                {nextPoint && (
                  <>
                    {(() => {
                      const nextX =
                        50 + ((nextPoint.year - minYear) / yearRange) * 700;
                      const nextPapersY =
                        175 - (nextPoint.papers / maxPapers) * 150;
                      const nextCitationsY =
                        175 - (nextPoint.citations / maxCitations) * 150;

                      const safeNextX = isNaN(nextX) ? safeX + 50 : nextX;
                      const safeNextPapersY = isNaN(nextPapersY)
                        ? safePapersY
                        : nextPapersY;
                      const safeNextCitationsY = isNaN(nextCitationsY)
                        ? safeCitationsY
                        : nextCitationsY;

                      return (
                        <>
                          <line
                            stroke={papersColor}
                            strokeWidth="2"
                            x1={safeX}
                            x2={safeNextX}
                            y1={safePapersY}
                            y2={safeNextPapersY}
                          />
                          <line
                            stroke={citationsColor}
                            strokeWidth="2"
                            x1={safeX}
                            x2={safeNextX}
                            y1={safeCitationsY}
                            y2={safeNextCitationsY}
                          />
                        </>
                      );
                    })()}
                  </>
                )}

                {/* Data points */}
                <circle cx={safeX} cy={safePapersY} fill={papersColor} r="4" />
                <circle
                  cx={safeX}
                  cy={safeCitationsY}
                  fill={citationsColor}
                  r="4"
                />

                {/* Year labels */}
                <text
                  className="text-xs"
                  fill={textColor}
                  textAnchor="middle"
                  x={safeX}
                  y="195"
                >
                  {point.year}
                </text>

                {/* Tooltips */}
                <title>{`${point.year}: ${point.papers} papers, ${point.citations} citations`}</title>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Data table */}
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-[var(--fqxi-paper-soft)]">
              <th className="px-3 py-2 text-left text-[var(--fqxi-ink)]">
                Year
              </th>
              <th className="px-3 py-2 text-left text-[var(--fqxi-ink)]">
                Papers
              </th>
              <th className="px-3 py-2 text-left text-[var(--fqxi-ink)]">
                Citations
              </th>
            </tr>
          </thead>
          <tbody>
            {cleanData.map((point) => (
              <tr
                key={point.year}
                className="border-b border-[var(--fqxi-border)]"
              >
                <td className="px-3 py-2 text-[var(--fqxi-ink-muted)]">
                  {point.year}
                </td>
                <td className="px-3 py-2 text-[var(--fqxi-ink-muted)]">
                  {point.papers}
                </td>
                <td className="px-3 py-2 text-[var(--fqxi-ink-muted)]">
                  {point.citations}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TimelineChart;
