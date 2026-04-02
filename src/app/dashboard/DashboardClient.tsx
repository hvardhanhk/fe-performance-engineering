"use client";

/**
 * DashboardClient — the interactive comparison dashboard.
 *
 * Split into a Client Component because:
 * - Reads localStorage for live metrics captured in the current session
 * - Has interactive tabs (no full-page navigation needed)
 * - Recharts is already in an async chunk; we import it lazily here too
 *
 * Architecture note: the heavy data (MOCK_COMPARISON, MOCK_LIGHTHOUSE) is
 * passed as props from the parent Server Component. This means the server
 * still participates in rendering — only the interactive shell is client-side.
 */

import { useState, useEffect, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  LineChart,
  Line,
  ReferenceLine,
} from "recharts";
import { getLatestSnapshot, loadVitalsHistory } from "@/lib/vitals";
import { generateTrend, MOCK_LATENCY } from "@/lib/mock-data";
import type {
  ComparisonEntry,
  LighthouseScore,
  BundleSize,
  VitalMetric,
} from "@/types/vitals";
import { CacheDemo } from "./CacheDemo";
import { LatencyDemo } from "./LatencyDemo";
import { NavTimingPanel } from "./NavTimingPanel";
import { WebPageTestPanel } from "./WebPageTestPanel";

interface Props {
  comparison: ComparisonEntry[];
  lighthouse: LighthouseScore[];
  bundles: BundleSize[];
}

type Tab = "vitals" | "lighthouse" | "bundles" | "trends" | "cache" | "latency" | "timing" | "wpt";

const TABS: { id: Tab; label: string }[] = [
  { id: "vitals",     label: "⚡ Core Web Vitals" },
  { id: "lighthouse", label: "🔦 Lighthouse"      },
  { id: "bundles",    label: "📦 Bundle Size"      },
  { id: "trends",     label: "📈 Trends"           },
  { id: "cache",      label: "🌐 CDN Cache"        },
  { id: "latency",    label: "⚡ Edge vs Origin"   },
  { id: "timing",     label: "🔬 Nav Timing"       },
  { id: "wpt",        label: "🎬 WebPageTest"      },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ratingColor(value: number, good: number, poor: number): string {
  if (value <= good) return "var(--good)";
  if (value <= poor) return "var(--warn)";
  return "var(--bad)";
}

function improvement(bad: number | null, opt: number | null): string {
  if (!bad || !opt) return "—";
  const pct = Math.round(((bad - opt) / bad) * 100);
  return `${pct}% faster`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DashboardClient({ comparison, lighthouse, bundles }: Props) {
  const [tab, setTab] = useState<Tab>("vitals");
  const [liveHistory, setLiveHistory] = useState<VitalMetric[]>([]);

  // Merge live browser measurements into the mock comparison data
  useEffect(() => {
    const update = () => setLiveHistory(loadVitalsHistory());
    update();
    const id = setInterval(update, 2000);
    return () => clearInterval(id);
  }, []);

  // Override mock values with live measurements if available
  const enrichedComparison = useMemo<ComparisonEntry[]>(() => {
    const badSnap = getLatestSnapshot("bad");
    const optSnap = getLatestSnapshot("optimized");
    return comparison.map((entry) => {
      const liveKey = entry.metric.toLowerCase() as keyof typeof badSnap;
      const liveOpt = (optSnap[liveKey] as VitalMetric | null)?.value;
      const liveBad = (badSnap[liveKey] as VitalMetric | null)?.value;
      return {
        ...entry,
        bad:       liveBad  ?? entry.bad,
        optimized: liveOpt  ?? entry.optimized,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comparison, liveHistory]);

  const badLH  = lighthouse.find((l) => l.page === "bad")!;
  const optLH  = lighthouse.find((l) => l.page === "optimized")!;
  const badBundle = bundles.find((b) => b.page === "bad")!;
  const optBundle = bundles.find((b) => b.page === "optimized")!;

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[--border] pb-4">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              tab === t.id
                ? "bg-[--accent] text-white"
                : "text-[--foreground]/60 hover:text-[--foreground] hover:bg-[--surface-hover]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Core Web Vitals tab ─────────────────────────────────────────────── */}
      {tab === "vitals" && (
        <div className="space-y-6">
          {/* Summary table */}
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[--foreground]/50 text-xs uppercase tracking-wider">
                  <th className="pb-3 pr-4">Metric</th>
                  <th className="pb-3 pr-4">❌ Bad</th>
                  <th className="pb-3 pr-4">✅ Optimized</th>
                  <th className="pb-3">Improvement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[--border]">
                {enrichedComparison.map((entry) => (
                  <tr key={entry.metric}>
                    <td className="py-3 pr-4 font-mono font-semibold">
                      {entry.metric}
                    </td>
                    <td
                      className="py-3 pr-4 font-mono tabular-nums"
                      style={{
                        color: ratingColor(
                          entry.bad ?? Infinity,
                          entry.goodThreshold,
                          entry.poorThreshold
                        ),
                      }}
                    >
                      {entry.bad
                        ? entry.metric === "CLS"
                          ? entry.bad.toFixed(3)
                          : `${Math.round(entry.bad)}ms`
                        : "—"}
                    </td>
                    <td
                      className="py-3 pr-4 font-mono tabular-nums"
                      style={{
                        color: ratingColor(
                          entry.optimized ?? Infinity,
                          entry.goodThreshold,
                          entry.poorThreshold
                        ),
                      }}
                    >
                      {entry.optimized
                        ? entry.metric === "CLS"
                          ? entry.optimized.toFixed(3)
                          : `${Math.round(entry.optimized)}ms`
                        : "—"}
                    </td>
                    <td className="py-3 text-[--good] font-medium">
                      {improvement(entry.bad, entry.optimized)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bar chart */}
          <div className="card space-y-3">
            <h3 className="text-sm font-semibold">
              Timing Comparison (ms, lower is better)
            </h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={enrichedComparison.filter((e) => e.metric !== "CLS")}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              >
                <XAxis
                  dataKey="metric"
                  tick={{ fontSize: 11, fill: "var(--foreground)" }}
                  opacity={0.7}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "var(--foreground)" }}
                  opacity={0.7}
                  unit="ms"
                />
                <Tooltip
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(v: any) => [`${Math.round(Number(v))}ms`]}
                  contentStyle={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: "4px",
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="bad"       name="❌ Bad"       fill="var(--bad)"  radius={[3, 3, 0, 0]} />
                <Bar dataKey="optimized" name="✅ Optimized" fill="var(--good)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Lighthouse tab ──────────────────────────────────────────────────── */}
      {tab === "lighthouse" && (
        <div className="space-y-6">
          {/* Score cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {(["performance", "accessibility", "bestPractices", "seo"] as const).map((key) => (
              <div key={key} className="card text-center space-y-2">
                <p className="text-xs uppercase tracking-wider text-[--foreground]/50">
                  {key.replace(/([A-Z])/g, " $1").trim()}
                </p>
                <div className="flex justify-center gap-4">
                  <div>
                    <p className="text-xs text-[--foreground]/40">Bad</p>
                    <p
                      className="text-2xl font-bold"
                      style={{ color: badLH[key] >= 90 ? "var(--good)" : badLH[key] >= 50 ? "var(--warn)" : "var(--bad)" }}
                    >
                      {badLH[key]}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[--foreground]/40">Opt</p>
                    <p
                      className="text-2xl font-bold"
                      style={{ color: optLH[key] >= 90 ? "var(--good)" : optLH[key] >= 50 ? "var(--warn)" : "var(--bad)" }}
                    >
                      {optLH[key]}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Radar chart */}
          <div className="card">
            <h3 className="text-sm font-semibold mb-4">Radar Comparison</h3>
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart
                data={[
                  { metric: "Performance",    bad: badLH.performance,    opt: optLH.performance    },
                  { metric: "Accessibility",  bad: badLH.accessibility,  opt: optLH.accessibility  },
                  { metric: "Best Practices", bad: badLH.bestPractices,  opt: optLH.bestPractices  },
                  { metric: "SEO",            bad: badLH.seo,            opt: optLH.seo            },
                ]}
              >
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis
                  dataKey="metric"
                  tick={{ fontSize: 11, fill: "var(--foreground)" }}
                />
                <Radar name="❌ Bad"       dataKey="bad" stroke="var(--bad)"  fill="var(--bad)"  fillOpacity={0.2} />
                <Radar name="✅ Optimized" dataKey="opt" stroke="var(--good)" fill="var(--good)" fillOpacity={0.2} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="card bg-[--surface-hover] text-xs text-[--foreground]/50 space-y-1">
            <p className="font-semibold text-[--foreground]/70">
              About these scores
            </p>
            <p>
              Mock data reflecting realistic deltas from production optimisation.
              Run <code className="font-mono bg-[--surface] px-1 rounded">npm run lhci</code> locally
              to generate real scores against your running dev server.
            </p>
          </div>
        </div>
      )}

      {/* ── Bundle Size tab ─────────────────────────────────────────────────── */}
      {tab === "bundles" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {[
              { page: "bad",       data: badBundle,  icon: "❌" },
              { page: "optimized", data: optBundle,   icon: "✅" },
            ].map(({ page, data, icon }) => (
              <div key={page} className="card space-y-3">
                <h3 className="font-semibold">
                  {icon} {page === "bad" ? "Bad Page" : "Optimized Page"}
                </h3>
                <div className="space-y-2 text-sm">
                  {[
                    { label: "JavaScript", value: data.jsKb,    color: "var(--accent)" },
                    { label: "CSS",         value: data.cssKb,   color: "var(--warn)"   },
                    { label: "Images",      value: data.imageKb, color: "var(--good)"   },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-3">
                      <span className="w-20 text-[--foreground]/60 text-xs">{item.label}</span>
                      <div className="flex-1 bg-[--surface-hover] rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(100, (item.value / 5000) * 100)}%`,
                            background: item.color,
                          }}
                        />
                      </div>
                      <span className="font-mono tabular-nums text-xs w-16 text-right">
                        {item.value} KB
                      </span>
                    </div>
                  ))}
                  <div className="border-t border-[--border] pt-2 flex justify-between font-semibold">
                    <span>Total</span>
                    <span className="font-mono">{data.totalKb} KB</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="card">
            <h3 className="text-sm font-semibold mb-4">Bundle Size Comparison</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={[
                  { name: "JS",     bad: badBundle.jsKb,    opt: optBundle.jsKb    },
                  { name: "CSS",    bad: badBundle.cssKb,   opt: optBundle.cssKb   },
                  { name: "Images", bad: badBundle.imageKb, opt: optBundle.imageKb },
                  { name: "Total",  bad: badBundle.totalKb, opt: optBundle.totalKb },
                ]}
              >
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--foreground)" }} opacity={0.7} />
                <YAxis tick={{ fontSize: 11, fill: "var(--foreground)" }} opacity={0.7} unit=" KB" />
                <Tooltip
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(v: any) => [`${v} KB`]}
                  contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "4px", fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="bad" name="❌ Bad"       fill="var(--bad)"  radius={[3, 3, 0, 0]} />
                <Bar dataKey="opt" name="✅ Optimized" fill="var(--good)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card bg-[--surface-hover] text-xs space-y-1">
            <p className="font-semibold text-[--foreground]/70">How to run the bundle analyser</p>
            <code className="block font-mono bg-[--surface] px-2 py-1 rounded text-[--accent]">
              ANALYZE=true npm run build
            </code>
            <p className="text-[--foreground]/50">
              Opens an interactive treemap in your browser showing every module in the bundle.
            </p>
          </div>
        </div>
      )}

      {/* ── Trends tab ──────────────────────────────────────────────────────── */}
      {tab === "trends" && (
        <div className="space-y-6">
          {(["LCP", "INP"] as const).map((metric) => (
            <div key={metric} className="card">
              <h3 className="text-sm font-semibold mb-4">{metric} — 7-day trend</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart
                  data={generateTrend(metric, "bad").map((d, i) => ({
                    ...d,
                    bad: d.value,
                    opt: generateTrend(metric, "optimized")[i].value,
                  }))}
                >
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--foreground)" }} opacity={0.7} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--foreground)" }} opacity={0.7} unit="ms" />
                  <Tooltip
                    contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "4px", fontSize: 12 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <ReferenceLine
                    y={metric === "LCP" ? 2500 : 200}
                    stroke="var(--good)"
                    strokeDasharray="4 2"
                    label={{ value: "Good", fill: "var(--good)", fontSize: 10 }}
                  />
                  <ReferenceLine
                    y={metric === "LCP" ? 4000 : 500}
                    stroke="var(--bad)"
                    strokeDasharray="4 2"
                    label={{ value: "Poor", fill: "var(--bad)", fontSize: 10 }}
                  />
                  <Line type="monotone" dataKey="bad" name="❌ Bad"       stroke="var(--bad)"  dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="opt" name="✅ Optimized" stroke="var(--good)" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>
      )}

      {/* ── Cache tab ───────────────────────────────────────────────────────── */}
      {tab === "cache" && <CacheDemo />}

      {/* ── Latency tab ─────────────────────────────────────────────────────── */}
      {tab === "latency" && <LatencyDemo initialData={MOCK_LATENCY} />}
      {tab === "timing"  && <NavTimingPanel />}
      {tab === "wpt"     && <WebPageTestPanel />}
    </div>
  );
}
