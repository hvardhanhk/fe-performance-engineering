"use client";

/**
 * WebPageTestPanel — displays WPT filmstrip and waterfall results.
 *
 * WHAT WEBPAGETEST ADDS THAT LIGHTHOUSE DOESN'T:
 *
 * Lighthouse runs locally in a simulated environment. WebPageTest runs
 * from real locations (Dulles, London, Sydney) over real network conditions.
 * This matters because:
 *
 * 1. Filmstrip: visual progression over time — shows EXACTLY what the
 *    user sees at 0.5s, 1.0s, 1.5s etc. Essential for diagnosing blank
 *    screens and layout shifts that Lighthouse scores miss.
 *
 * 2. Waterfall: every network request in timeline order. Shows:
 *    - Render-blocking resources (red bars at the top)
 *    - Request chaining (each request waiting for the previous)
 *    - Cache hit/miss per resource
 *    - DNS / TCP / TLS overhead per domain
 *
 * 3. Geographic latency: a CDN hit in Dulles is 30ms TTFB. The same
 *    request hitting us-east-1 origin from London is 180ms. WPT shows
 *    this difference concretely.
 *
 * 4. Real network throttling: WPT uses actual traffic shaping on real
 *    hardware, not CPU/bandwidth simulation. Results are reproducible
 *    and comparable across runs.
 *
 * Staff-level usage: run WPT after every major release, store the
 * testId in your database, display the filmstrip in your internal
 * perf dashboard. A regression in Speed Index shows up visually before
 * any engineer notices it in the field data.
 */

import { useState } from "react";
import Image from "next/image";
import { WPT_RESULTS } from "@/lib/wpt-data";
import type { WPTResult } from "@/lib/wpt-data";

type View = "filmstrip" | "waterfall" | "metrics";

export function WebPageTestPanel() {
  const [view, setView] = useState<View>("filmstrip");

  const bad = WPT_RESULTS.find((r) => r.page === "bad")!;
  const opt = WPT_RESULTS.find((r) => r.page === "optimized")!;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card space-y-2">
        <h3 className="font-semibold">WebPageTest Results</h3>
        <p className="text-sm text-[--foreground]/60">
          Tests run from {bad.location} over {bad.connection}.
          Filmstrip and waterfall show the full visual progression and request timeline.
        </p>
        <div className="flex gap-2 text-xs">
          {(["filmstrip", "waterfall", "metrics"] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1 rounded font-medium transition-colors capitalize ${
                view === v
                  ? "bg-[--accent] text-white"
                  : "bg-[--surface-hover] text-[--foreground]/60 hover:text-[--foreground]"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* ── Filmstrip view ─────────────────────────────────────────────────── */}
      {view === "filmstrip" && (
        <div className="grid gap-6 lg:grid-cols-2">
          {[bad, opt].map((result) => (
            <FilmstripCard key={result.page} result={result} />
          ))}
        </div>
      )}

      {/* ── Waterfall view ─────────────────────────────────────────────────── */}
      {view === "waterfall" && (
        <div className="space-y-6">
          {[bad, opt].map((result) => (
            <div key={result.page} className="card space-y-3">
              <div className="flex items-center gap-2">
                <span>{result.page === "bad" ? "❌" : "✅"}</span>
                <h3 className="font-semibold capitalize">{result.page} Page Waterfall</h3>
                <span className="text-xs text-[--foreground]/40 ml-auto">
                  {result.metrics.requests} requests · {result.metrics.bytesIn} KB
                </span>
              </div>
              <div className="bg-[--surface-hover] rounded overflow-hidden">
                <Image
                  src={result.waterfallSrc}
                  alt={`${result.page} page waterfall chart`}
                  width={600}
                  height={result.page === "bad" ? 320 : 280}
                  className="w-full h-auto"
                  unoptimized  // SVGs don't benefit from next/image processing
                />
              </div>
              <p className="text-xs text-[--foreground]/50 leading-relaxed">
                {result.summary}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ── Metrics view ───────────────────────────────────────────────────── */}
      {view === "metrics" && (
        <div className="space-y-6">
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
                {METRIC_ROWS.map((row) => {
                  const badVal = bad.metrics[row.key as keyof typeof bad.metrics] as number;
                  const optVal = opt.metrics[row.key as keyof typeof opt.metrics] as number;
                  const pct = Math.round(((badVal - optVal) / badVal) * 100);
                  return (
                    <tr key={row.label}>
                      <td className="py-2.5 pr-4 font-medium">{row.label}</td>
                      <td
                        className="py-2.5 pr-4 font-mono tabular-nums"
                        style={{ color: "var(--bad)" }}
                      >
                        {row.format(badVal)}
                      </td>
                      <td
                        className="py-2.5 pr-4 font-mono tabular-nums"
                        style={{ color: "var(--good)" }}
                      >
                        {row.format(optVal)}
                      </td>
                      <td className="py-2.5 text-[--good] font-semibold text-sm">
                        {pct > 0 ? `${pct}% better` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="card bg-[--surface-hover] text-xs space-y-2">
            <p className="font-semibold text-[--foreground]/70">How to run real WPT tests</p>
            <code className="block font-mono bg-[--surface] px-2 py-1 rounded text-[--accent]">
              curl -s &apos;https://www.webpagetest.org/runtest.php?url=YOUR_URL&amp;k=API_KEY&amp;f=json&apos;
            </code>
            <p className="text-[--foreground]/50">
              Set <code className="font-mono">WEBPAGETEST_API_KEY</code> in your env and add the trigger step
              to <code className="font-mono">.github/workflows/ci.yml</code>. Store the testId and poll
              until complete, then fetch the JSON result.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Filmstrip card ───────────────────────────────────────────────────────────

function FilmstripCard({ result }: { result: WPTResult }) {
  return (
    <div className="card space-y-3">
      <div className="flex items-center gap-2">
        <span>{result.page === "bad" ? "❌" : "✅"}</span>
        <h3 className="font-semibold capitalize">{result.page} Page Filmstrip</h3>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {result.filmstripFrames.map((frame) => (
          <div key={frame.time} className="space-y-1">
            <div className="bg-[--surface-hover] rounded overflow-hidden">
              <Image
                src={frame.src}
                alt={frame.label}
                width={160}
                height={120}
                className="w-full h-auto"
                unoptimized
              />
            </div>
            <p className="text-xs text-center font-mono" style={{
              color: result.page === "bad" ? "var(--bad)" : "var(--good)"
            }}>
              {frame.time}
            </p>
            <p className="text-xs text-center text-[--foreground]/40 leading-tight">
              {frame.label}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3 text-xs pt-2 border-t border-[--border]">
        <Stat label="LCP" value={`${(result.metrics.largestContentfulPaint / 1000).toFixed(1)}s`} bad={result.page === "bad"} />
        <Stat label="CLS" value={result.metrics.cumulativeLayoutShift.toFixed(2)} bad={result.page === "bad"} />
        <Stat label="Speed Index" value={`${(result.metrics.speedIndex / 1000).toFixed(1)}s`} bad={result.page === "bad"} />
      </div>
    </div>
  );
}

function Stat({ label, value, bad }: { label: string; value: string; bad: boolean }) {
  return (
    <div className="text-center">
      <p className="text-[--foreground]/40">{label}</p>
      <p className="font-mono font-semibold" style={{ color: bad ? "var(--bad)" : "var(--good)" }}>
        {value}
      </p>
    </div>
  );
}

// ─── Metric table rows ────────────────────────────────────────────────────────

const METRIC_ROWS: { label: string; key: string; format: (v: number) => string }[] = [
  { label: "TTFB",            key: "TTFB",                    format: (v) => `${v}ms`             },
  { label: "FCP",             key: "firstContentfulPaint",    format: (v) => `${v}ms`             },
  { label: "LCP",             key: "largestContentfulPaint",  format: (v) => `${v}ms`             },
  { label: "CLS",             key: "cumulativeLayoutShift",   format: (v) => v.toFixed(2)         },
  { label: "TBT",             key: "totalBlockingTime",       format: (v) => `${v}ms`             },
  { label: "Speed Index",     key: "speedIndex",              format: (v) => `${v}ms`             },
  { label: "Fully Loaded",    key: "fullyLoaded",             format: (v) => `${v}ms`             },
  { label: "Requests",        key: "requests",                format: (v) => `${v}`               },
  { label: "Transfer Size",   key: "bytesIn",                 format: (v) => `${v} KB`            },
];
