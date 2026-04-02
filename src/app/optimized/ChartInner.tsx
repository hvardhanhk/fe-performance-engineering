"use client";

/**
 * ChartInner — the actual recharts component.
 * Separated into its own module so that the dynamic import in LazyChart
 * creates a distinct code-split chunk. The bundler (webpack/turbopack) will
 * put this file and its recharts dependencies in a separate async chunk.
 */

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface DataPoint {
  name: string;
  optimized: number;
  bad: number;
}

export function ChartInner({ data }: { data: DataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <XAxis
          dataKey="name"
          tick={{ fontSize: 10, fill: "var(--foreground)" }}
          opacity={0.5}
        />
        <YAxis
          tick={{ fontSize: 10, fill: "var(--foreground)" }}
          opacity={0.5}
          unit="ms"
        />
        <Tooltip
          contentStyle={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            fontSize: 12,
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: 12 }}
        />
        <Line
          type="monotone"
          dataKey="optimized"
          stroke="var(--good)"
          dot={false}
          strokeWidth={2}
          name="Optimized"
        />
        <Line
          type="monotone"
          dataKey="bad"
          stroke="var(--bad)"
          dot={false}
          strokeWidth={2}
          name="Bad"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
