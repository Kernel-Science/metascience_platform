"use client";

import React, { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// Warm palette that sits well on the FQxI paper background.
const CHART_COLORS = [
  "#b8a216", "#6366f1", "#0d9488", "#d97706", "#db2777",
  "#7c3aed", "#dc2626", "#0891b2", "#65a30d", "#9333ea",
];

interface ChartInput {
  type: "bar" | "line" | "area" | "pie" | "scatter";
  title: string;
  description?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  data: { x: string; series: { name: string; value: number }[] }[];
}

// Renders a chart from a create_chart tool *input* (the model's spec).
export const ChatChart: React.FC<{ input: ChartInput }> = ({ input }) => {
  // Pivot [{x, series:[{name,value}]}] into recharts rows {x, [name]: value}.
  const { rows, seriesNames } = useMemo(() => {
    const names: string[] = [];
    const rows = (input?.data || []).map((d) => {
      const row: Record<string, any> = { x: d.x };

      for (const s of d.series || []) {
        if (!names.includes(s.name)) names.push(s.name);
        row[s.name] = s.value;
      }

      return row;
    });

    return { rows, seriesNames: names };
  }, [input]);

  if (!rows.length) return null;

  const axisStyle = { fontSize: 12, fill: "var(--fqxi-ink-muted)" } as const;
  const common = (
    <>
      <CartesianGrid stroke="var(--fqxi-border)" strokeDasharray="3 3" />
      <XAxis
        dataKey="x"
        label={
          input.xAxisLabel
            ? { value: input.xAxisLabel, position: "insideBottom", offset: -4, fontSize: 12 }
            : undefined
        }
        tick={axisStyle}
      />
      <YAxis
        label={
          input.yAxisLabel
            ? { value: input.yAxisLabel, angle: -90, position: "insideLeft", fontSize: 12 }
            : undefined
        }
        tick={axisStyle}
      />
      <Tooltip
        contentStyle={{
          background: "var(--fqxi-paper)",
          border: "1px solid var(--fqxi-border)",
          borderRadius: 8,
          fontSize: 13,
        }}
      />
      {seriesNames.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
    </>
  );

  let chart: React.ReactElement;

  switch (input.type) {
    case "line":
      chart = (
        <LineChart data={rows}>
          {common}
          {seriesNames.map((n, i) => (
            <Line
              key={n}
              dataKey={n}
              dot={rows.length <= 30}
              stroke={CHART_COLORS[i % CHART_COLORS.length]}
              strokeWidth={2}
              type="monotone"
            />
          ))}
        </LineChart>
      );
      break;
    case "area":
      chart = (
        <AreaChart data={rows}>
          {common}
          {seriesNames.map((n, i) => (
            <Area
              key={n}
              dataKey={n}
              fill={CHART_COLORS[i % CHART_COLORS.length]}
              fillOpacity={0.25}
              stroke={CHART_COLORS[i % CHART_COLORS.length]}
              strokeWidth={2}
              type="monotone"
            />
          ))}
        </AreaChart>
      );
      break;
    case "scatter":
      chart = (
        <ScatterChart>
          {common}
          {seriesNames.map((n, i) => (
            <Scatter
              key={n}
              data={rows}
              dataKey={n}
              fill={CHART_COLORS[i % CHART_COLORS.length]}
              name={n}
            />
          ))}
        </ScatterChart>
      );
      break;
    case "pie": {
      const first = seriesNames[0];
      const pieData = rows.map((r) => ({ name: r.x, value: r[first] ?? 0 }));

      chart = (
        <PieChart>
          <Tooltip
            contentStyle={{
              background: "var(--fqxi-paper)",
              border: "1px solid var(--fqxi-border)",
              borderRadius: 8,
              fontSize: 13,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Pie
            cx="50%"
            cy="50%"
            data={pieData}
            dataKey="value"
            label={({ percent }) => `${Math.round((percent || 0) * 100)}%`}
            nameKey="name"
            outerRadius="75%"
          >
            {pieData.map((_, i) => (
              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      );
      break;
    }
    default:
      chart = (
        <BarChart data={rows}>
          {common}
          {seriesNames.map((n, i) => (
            <Bar
              key={n}
              dataKey={n}
              fill={CHART_COLORS[i % CHART_COLORS.length]}
              radius={[3, 3, 0, 0]}
            />
          ))}
        </BarChart>
      );
  }

  return (
    <div className="min-w-0">
      <div className="mb-1 text-sm font-semibold text-[var(--fqxi-ink)]">
        {input.title}
      </div>
      {input.description && (
        <div className="mb-2 text-xs text-[var(--fqxi-ink-muted)]">
          {input.description}
        </div>
      )}
      <div className="h-72 w-full">
        <ResponsiveContainer height="100%" width="100%">
          {chart}
        </ResponsiveContainer>
      </div>
    </div>
  );
};
