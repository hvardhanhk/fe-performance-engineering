"use client";

/**
 * LatencyDemo — Edge vs Origin TTFB comparison.
 *
 * Makes parallel requests to:
 *   /api/edge-latency   — runs at the edge (Next.js middleware, no cold start)
 *   /api/origin-latency — simulates an origin server with artificial delay
 *
 * Visualises the TTFB difference in a bar chart.
 *
 * Edge function tradeoffs (documented for interview readiness):
 * - PRO: ~10ms TTFB vs 150-300ms for origin
 * - PRO: No cold-start (always warm at CDN PoPs)
 * - CON: No Node.js APIs (no filesystem, limited crypto)
 * - CON: No database connections (must use HTTP APIs or KV stores)
 * - CON: 1MB code size limit (Vercel Edge)
 */

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { LatencyResult } from "@/types/vitals";

interface Props {
  initialData: LatencyResult[];
}

interface Run {
  runId: number;
  edge: LatencyResult & { clientMs: number };
  origin: LatencyResult & { clientMs: number };
}

export function LatencyDemo({ initialData }: Props) {
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(false);

  async function measure() {
    setLoading(true);
    try {
      // ✅ Parallel fetch — both run simultaneously
      const [edgeRes, originRes] = await Promise.all([
        measureOne("/api/edge-latency"),
        measureOne("/api/origin-latency"),
      ]);

      setRuns((prev) => [
        ...prev,
        {
          runId: prev.length + 1,
          edge:   edgeRes,
          origin: originRes,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const chartData = runs.map((r) => ({
    run: `Run ${r.runId}`,
    "Edge TTFB":   r.edge.ttfbMs,
    "Origin TTFB": r.origin.ttfbMs,
  }));

  // Use initial mock data to seed the chart on first render
  const displayData =
    chartData.length > 0
      ? chartData
      : [
          {
            run: "Mock",
            "Edge TTFB":   initialData.find((d) => d.type === "edge")?.ttfbMs ?? 12,
            "Origin TTFB": initialData.find((d) => d.type === "origin")?.ttfbMs ?? 180,
          },
        ];

  return (
    <div className="space-y-6">
      <div className="card space-y-3">
        <h3 className="font-semibold">Edge vs Origin Latency</h3>
        <p className="text-sm text-[--foreground]/60">
          Measures Time to First Byte (TTFB) from an edge worker vs an origin
          API route. Click &ldquo;Run measurement&rdquo; to add a data point.
        </p>
        <button
          onClick={measure}
          disabled={loading}
          className="px-4 py-2 rounded bg-[--accent] hover:bg-[--accent-hover] text-white text-sm font-medium transition-colors disabled:opacity-50"
        >
          {loading ? "Measuring…" : "⚡ Run measurement"}
        </button>
      </div>

      <div className="card">
        <h3 className="text-sm font-semibold mb-4">TTFB Comparison (ms, lower is better)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={displayData}>
            <XAxis dataKey="run" tick={{ fontSize: 11, fill: "var(--foreground)" }} opacity={0.7} />
            <YAxis tick={{ fontSize: 11, fill: "var(--foreground)" }} opacity={0.7} unit="ms" />
            <Tooltip
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(v: any) => [`${v}ms`]}
              contentStyle={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "4px",
                fontSize: 12,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="Edge TTFB"   fill="var(--good)" radius={[3, 3, 0, 0]} />
            <Bar dataKey="Origin TTFB" fill="var(--bad)"  radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {runs.length > 0 && (
        <div className="card overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-[--foreground]/50 uppercase tracking-wider">
                <th className="pb-2 pr-4">Run</th>
                <th className="pb-2 pr-4">Edge TTFB</th>
                <th className="pb-2 pr-4">Origin TTFB</th>
                <th className="pb-2">Speedup</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[--border]">
              {runs.map((run) => (
                <tr key={run.runId}>
                  <td className="py-2 pr-4 font-mono">{run.runId}</td>
                  <td className="py-2 pr-4 font-mono text-[--good]">
                    {run.edge.ttfbMs}ms
                  </td>
                  <td className="py-2 pr-4 font-mono text-[--bad]">
                    {run.origin.ttfbMs}ms
                  </td>
                  <td className="py-2 text-[--good] font-medium">
                    {Math.round(run.origin.ttfbMs / run.edge.ttfbMs)}× faster
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="card bg-[--surface-hover] text-xs space-y-2">
        <p className="font-semibold text-[--foreground]/70">Why edge is faster</p>
        <ul className="space-y-1 text-[--foreground]/50">
          <li>• Edge functions run at CDN PoPs — physically closer to the user</li>
          <li>• No cold starts — always warm</li>
          <li>• No TLS handshake overhead for cached responses</li>
          <li>• Tradeoff: no Node.js APIs, 1MB size limit, no DB connections</li>
        </ul>
      </div>
    </div>
  );
}

async function measureOne(
  url: string
): Promise<LatencyResult & { clientMs: number }> {
  const start = performance.now();
  const res = await fetch(url, { cache: "no-store" });
  const data: LatencyResult = await res.json();
  const clientMs = Math.round(performance.now() - start);
  return { ...data, clientMs };
}
