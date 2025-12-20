"use client";

import React from "react";

interface DoughnutChartProps {
  data: Array<{ name: string; value: number }>;
}

const DoughnutChart: React.FC<DoughnutChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return <p>No data available for chart.</p>;
  }

  // Validate and clean the data
  const cleanData = data.filter(
    (item) =>
      item &&
      typeof item === "object" &&
      "name" in item &&
      "value" in item &&
      !isNaN(item.value) &&
      item.value > 0,
  );

  if (cleanData.length === 0) {
    return <p>No valid data available for chart.</p>;
  }

  const total = cleanData.reduce((sum, item) => sum + item.value, 0);
  const colors = [
    "rgba(255, 99, 132, 0.7)",
    "rgba(54, 162, 235, 0.7)",
    "rgba(255, 206, 86, 0.7)",
    "rgba(75, 192, 192, 0.7)",
    "rgba(153, 102, 255, 0.7)",
    "rgba(255, 159, 64, 0.7)",
  ];

  let cumulativePercentage = 0;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-64 h-64">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 42 42">
          <circle
            cx="21"
            cy="21"
            fill="transparent"
            r="15.91549430918953"
            stroke="#e5e7eb"
            strokeWidth="3"
          />
          {cleanData.map((item, index) => {
            const percentage = (item.value / total) * 100;
            const strokeDasharray = `${percentage} ${100 - percentage}`;
            const strokeDashoffset = -cumulativePercentage;

            cumulativePercentage += percentage;

            return (
              <circle
                key={`${item.name}-${index}`}
                className="transition-all duration-300"
                cx="21"
                cy="21"
                fill="transparent"
                r="15.91549430918953"
                stroke={colors[index % colors.length]}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeWidth="3"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800">
              {cleanData.length}
            </div>
            <div className="text-sm text-gray-600">Topics</div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 w-full max-w-sm">
        {cleanData.map((item, index) => (
          <div
            key={`${item.name}-legend-${index}`}
            className="flex items-center space-x-2"
          >
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: colors[index % colors.length] }}
            />
            <div className="text-sm text-gray-700 truncate">{item.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DoughnutChart;
