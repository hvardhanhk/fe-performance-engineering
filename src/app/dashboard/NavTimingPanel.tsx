"use client";

/**
 * NavTimingPanel — visualises the Navigation Timing breakdown.
 *
 * STAFF-LEVEL VALUE:
 * Most engineers look at a single TTFB number. A staff engineer asks:
 * "Which part of TTFB is slow?" This panel shows:
 *
 *   DNS → TCP → TLS → Server processing → Response download → DOM parse
 *
 * This tells you WHERE to focus:
 *   - DNS slow?  → Add dns-prefetch hints, use a shorter TTL
 *   - TCP slow?  → CDN PoP too far from user, or keep-alive not configured
 *   - TLS slow?  → TLS 1.3 not enabled, no OCSP stapling
 *   - Server?    → Slow database query, no ISR/edge cache, cold container start
 *   - DOM parse? → Render-blocking scripts, large HTML, no code splitting
 *
 * You can read this data via: window.__perf_nav_timing in DevTools.
 */

import { useState, useEffect } from "react";
import { loadNavigationTiming, loadLongTasks } from "@/lib/vitals";
import type { NavigationTimingBreakdown, LongTask } from "@/lib/vitals";

export function NavTimingPanel() {
  const [timing, setTiming] = useState<NavigationTimingBreakdown | null>(null);
  const [longTasks, setLongTasks] = useState<LongTask[]>([]);

  useEffect(() => {
    const update = () => {
      setTiming(loadNavigationTiming());
      setLongTasks(loadLongTasks());
    };
    update();
    const id = setInterval(update, 2000);
    return () => clearInterval(id);
  }, []);

  const phases = timing
    ? [
        { label: "DNS lookup",      value: timing.dns,           max: 200,  color: "var(--accent)" },
        { label: "TCP connect",     value: timing.tcp,           max: 200,  color: "var(--accent)" },
        { label: "TLS handshake",   value: timing.tls,           max: 200,  color: "var(--warn)"   },
        { label: "Server (TTFB)",   value: timing.request,       max: 2000, color: timing.request > 800 ? "var(--bad)" : "var(--good)" },
        { label: "Response DL",     value: timing.response,      max: 500,  color: "var(--accent)" },
        { label: "DOM parse",       value: timing.domParsing,    max: 3000, color: timing.domParsing > 500 ? "var(--bad)" : "var(--good)" },
        { label: "DOM interactive", value: timing.domInteractive,max: 5000, color: "var(--accent)" },
      ]
    : [];

  const totalTasks = longTasks.length;
  const tasksByPage = longTasks.reduce<Record<string, number>>((acc, t) => {
    acc[t.page] = (acc[t.page] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Navigation Timing waterfall */}
      <div className="card space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-semibold">Navigation Timing Waterfall</h2>
            <p className="text-xs text-[--foreground]/50 mt-0.5">
              Load the page then navigate here — shows the full pipeline breakdown.
            </p>
          </div>
          {timing && (
            <div className="text-right">
              <p className="text-xs text-[--foreground]/40">Page</p>
              <p className="text-sm font-mono font-semibold text-[--accent]">{timing.page}</p>
            </div>
          )}
        </div>

        {!timing ? (
          <p className="text-sm text-[--foreground]/40">
            Navigate to /bad or /optimized first, then return here.
            Data is captured automatically on every page load.
          </p>
        ) : (
          <div className="space-y-3">
            {phases.map((phase) => (
              <div key={phase.label} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-[--foreground]/70">{phase.label}</span>
                  <span
                    className="font-mono tabular-nums font-semibold"
                    style={{ color: phase.color }}
                  >
                    {phase.value}ms
                  </span>
                </div>
                {/* Proportional bar — max width = phase.max ms */}
                <div className="h-2 bg-[--surface-hover] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, (phase.value / phase.max) * 100)}%`,
                      background: phase.color,
                    }}
                  />
                </div>
              </div>
            ))}

            <div className="border-t border-[--border] pt-3 grid grid-cols-3 gap-4 text-xs">
              <div>
                <p className="text-[--foreground]/40">Total TTFB</p>
                <p className="font-mono font-semibold" style={{ color: timing.ttfb > 800 ? "var(--bad)" : "var(--good)" }}>
                  {timing.ttfb}ms
                </p>
              </div>
              <div>
                <p className="text-[--foreground]/40">DOM Interactive</p>
                <p className="font-mono font-semibold text-[--accent]">{timing.domInteractive}ms</p>
              </div>
              <div>
                <p className="text-[--foreground]/40">DOM Complete</p>
                <p className="font-mono font-semibold text-[--accent]">{timing.domComplete}ms</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Long Tasks */}
      <div className="card space-y-4">
        <div>
          <h2 className="font-semibold">Long Tasks Observer</h2>
          <p className="text-xs text-[--foreground]/50 mt-0.5">
            Tasks &gt;50ms block the main thread and cause high INP.
            Detected automatically via PerformanceObserver.
          </p>
        </div>

        {totalTasks === 0 ? (
          <p className="text-sm text-[--foreground]/40">
            No long tasks recorded yet. Visit /bad and interact with the page — the
            unoptimised filter and re-renders should trigger several.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="card">
                <p className="text-xs text-[--foreground]/40">Total detected</p>
                <p className="text-2xl font-bold text-[--bad]">{totalTasks}</p>
              </div>
              <div className="card">
                <p className="text-xs text-[--foreground]/40">On /bad</p>
                <p className="text-2xl font-bold text-[--bad]">{tasksByPage["bad"] ?? 0}</p>
              </div>
              <div className="card">
                <p className="text-xs text-[--foreground]/40">On /optimized</p>
                <p className="text-2xl font-bold text-[--good]">{tasksByPage["optimized"] ?? 0}</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-[--foreground]/50 uppercase tracking-wider">
                    <th className="pb-2 pr-4">Duration</th>
                    <th className="pb-2 pr-4">Start Time</th>
                    <th className="pb-2 pr-4">Page</th>
                    <th className="pb-2">Attribution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[--border]">
                  {longTasks.slice(-10).reverse().map((task, i) => (
                    <tr key={i}>
                      <td
                        className="py-2 pr-4 font-mono font-semibold"
                        style={{ color: task.duration > 200 ? "var(--bad)" : "var(--warn)" }}
                      >
                        {task.duration}ms
                      </td>
                      <td className="py-2 pr-4 font-mono text-[--foreground]/50">
                        +{task.startTime}ms
                      </td>
                      <td className="py-2 pr-4">
                        <span className={task.page === "bad" ? "badge-bad" : "badge-good"}>
                          {task.page}
                        </span>
                      </td>
                      <td className="py-2 text-[--foreground]/40 max-w-xs truncate">
                        {task.attribution}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div className="card bg-[--surface-hover] text-xs space-y-2">
        <p className="font-semibold text-[--foreground]/70">Debugging Long Tasks in Production</p>
        <p className="text-[--foreground]/50">
          Long Tasks are observable in DevTools → Performance tab (red bars on the main thread).
          In production, the Attribution API identifies the script URL.
          For third-party scripts, use a &lt;script async&gt; or move them to a Web Worker.
        </p>
        <code className="block font-mono bg-[--surface] px-2 py-1 rounded text-[--accent]">
          window.__perf_LCP  // inspect in DevTools console
        </code>
      </div>
    </div>
  );
}
