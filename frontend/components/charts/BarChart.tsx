"use client";

import React from "react";

interface BarChartProps {
  data: Array<{ name: string; count: number }>;
  title?: string;
}

const BarChart: React.FC<BarChartProps> = ({ data, title }) => {
  if (!data || data.length === 0) {
    return (
      <p className="text-[var(--fqxi-ink-muted)]">
        No data available for {title}.
      </p>
    );
  }

  // Validate and clean the data
  const cleanData = data.filter(
    (item) =>
      item &&
      typeof item === "object" &&
      "name" in item &&
      "count" in item &&
      !isNaN(item.count) &&
      item.count >= 0,
  );

  if (cleanData.length === 0) {
    return (
      <p className="text-[var(--fqxi-ink-muted)]">
        No valid data available for {title}.
      </p>
    );
  }

  const maxCount = Math.max(...cleanData.map((item) => item.count), 1);

  return (
    <div>
      {title && (
        <h4 className="mb-2 text-lg font-semibold text-[var(--fqxi-ink)]">
          {title}
        </h4>
      )}
      <div className="space-y-2">
        {cleanData.map((item, index) => (
          <div
            key={`${item.name}-${index}`}
            className="flex items-center space-x-2"
          >
            <div className="w-36 truncate text-sm text-[var(--fqxi-ink-muted)]">
              {item.name}
            </div>
            <div className="relative h-4 flex-1 rounded-full border border-[var(--fqxi-border)] bg-[var(--fqxi-paper-soft)]">
              <div
                className="h-4 rounded-full bg-[var(--fqxi-yellow)] transition-all duration-300"
                style={{ width: `${(item.count / maxCount) * 100}%` }}
              />
              <span className="absolute right-2 top-0 text-xs leading-4 text-[var(--fqxi-ink)]">
                {item.count}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BarChart;
