"use client";

import React from "react";

interface BarChartProps {
  data: Array<{ name: string; count: number }>;
  title?: string;
}

const BarChart: React.FC<BarChartProps> = ({ data, title }) => {
  if (!data || data.length === 0) {
    return <p>No data available for {title}.</p>;
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
    return <p>No valid data available for {title}.</p>;
  }

  const maxCount = Math.max(...cleanData.map((item) => item.count), 1);

  return (
    <div>
      {title && <h4 className="text-lg font-semibold mb-2">{title}</h4>}
      <div className="space-y-2">
        {cleanData.map((item, index) => (
          <div
            key={`${item.name}-${index}`}
            className="flex items-center space-x-2"
          >
            <div className="w-32 text-sm text-gray-700 dark:text-gray-300 truncate">
              {item.name}
            </div>
            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-4 relative">
              <div
                className="bg-blue-500 h-4 rounded-full transition-all duration-300"
                style={{ width: `${(item.count / maxCount) * 100}%` }}
              />
              <span className="absolute right-2 top-0 text-xs text-gray-600 dark:text-gray-300 leading-4">
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
