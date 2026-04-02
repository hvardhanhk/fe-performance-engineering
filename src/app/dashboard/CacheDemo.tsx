"use client";

/**
 * CacheDemo — demonstrates CDN Cache-Control headers.
 *
 * Makes sequential requests to /api/cache-demo:
 *   1. First request (MISS): goes to the origin, gets a timestamp + slow response
 *   2. Second request (HIT):  served from CDN cache — near-instant, same timestamp
 *
 * The timing difference is visible in the UI and demonstrates why
 * stale-while-revalidate dramatically improves perceived performance.
 */

import { useState } from "react";
import type { CacheDemoResult } from "@/types/vitals";

interface Run {
  attempt: number;
  result: CacheDemoResult;
  clientMs: number;
}

export function CacheDemo() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(false);

  async function runRequest(bust: boolean) {
    setLoading(true);
    const start = performance.now();
    try {
      const url = bust ? "/api/cache-demo?bust=1" : "/api/cache-demo";
      const res = await fetch(url, { cache: "no-store" }); // bypass browser cache to see CDN headers
      const data: CacheDemoResult = await res.json();
      const clientMs = Math.round(performance.now() - start);
      setRuns((prev) => [
        ...prev,
        { attempt: prev.length + 1, result: data, clientMs },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="card space-y-3">
        <h2 className="font-semibold">CDN Cache Demonstration</h2>
        <p className="text-sm text-[--foreground]/60">
          Click &ldquo;Bust cache&rdquo; to force a MISS (slow, origin hit), then
          click &ldquo;Cached request&rdquo; repeatedly to see HIT responses
          (fast, served from CDN cache).
        </p>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => runRequest(true)}
            disabled={loading}
            className="px-4 py-2 rounded bg-[--bad]/80 hover:bg-[--bad] text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            💥 Bust cache (MISS)
          </button>
          <button
            onClick={() => runRequest(false)}
            disabled={loading}
            className="px-4 py-2 rounded bg-[--good]/80 hover:bg-[--good] text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            ⚡ Cached request (HIT)
          </button>
          {runs.length > 0 && (
            <button
              onClick={() => setRuns([])}
              className="px-4 py-2 rounded bg-[--surface-hover] text-sm font-medium transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {runs.length > 0 && (
        <div className="card space-y-3 overflow-x-auto">
          <h3 className="text-sm font-semibold">Request Log</h3>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-[--foreground]/50 uppercase tracking-wider">
                <th className="pb-2 pr-4">#</th>
                <th className="pb-2 pr-4">Status</th>
                <th className="pb-2 pr-4">Client RTT</th>
                <th className="pb-2 pr-4">Server Time</th>
                <th className="pb-2 pr-4">Region</th>
                <th className="pb-2">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[--border]">
              {runs.map((run) => (
                <tr key={run.attempt}>
                  <td className="py-2 pr-4 font-mono">{run.attempt}</td>
                  <td className="py-2 pr-4">
                    <span
                      className={
                        run.result.cacheStatus === "HIT"
                          ? "badge-good"
                          : "badge-bad"
                      }
                    >
                      {run.result.cacheStatus}
                    </span>
                  </td>
                  <td
                    className="py-2 pr-4 font-mono tabular-nums"
                    style={{
                      color:
                        run.clientMs < 100 ? "var(--good)" : run.clientMs < 300 ? "var(--warn)" : "var(--bad)",
                    }}
                  >
                    {run.clientMs}ms
                  </td>
                  <td className="py-2 pr-4 font-mono tabular-nums text-[--foreground]/60">
                    {run.result.responseTimeMs}ms
                  </td>
                  <td className="py-2 pr-4 text-[--foreground]/60">
                    {run.result.serverRegion}
                  </td>
                  <td className="py-2 text-[--foreground]/40 font-mono">
                    {new Date(run.result.timestamp).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="card bg-[--surface-hover] text-xs space-y-2">
        <p className="font-semibold text-[--foreground]/70">Cache-Control strategy</p>
        <code className="block font-mono bg-[--surface] px-2 py-1 rounded text-[--accent]">
          Cache-Control: public, s-maxage=60, stale-while-revalidate=300
        </code>
        <ul className="space-y-1 text-[--foreground]/50">
          <li><strong>s-maxage=60</strong> — CDN caches for 60 seconds; browser always gets fresh data from CDN</li>
          <li><strong>stale-while-revalidate=300</strong> — after 60s, CDN serves stale instantly while fetching fresh in background</li>
          <li><strong>immutable</strong> — applied to <code>/_next/static/</code> assets (content-hashed filenames)</li>
        </ul>
      </div>
    </div>
  );
}
