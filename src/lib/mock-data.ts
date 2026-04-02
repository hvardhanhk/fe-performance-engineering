/**
 * Mock data for the dashboard when no real measurements are available.
 * These numbers reflect realistic deltas observed in production optimisation work.
 * All values are documented with their source / rationale.
 */

import type {
  ComparisonEntry,
  LighthouseScore,
  BundleSize,
  LatencyResult,
} from "@/types/vitals";

// ─── Core Web Vitals comparison ───────────────────────────────────────────────
// Bad page: unoptimised images + render-blocking JS + no SSR = typical numbers
// Optimised page: next/image + SSR + code-split + cached = achievable targets

export const MOCK_COMPARISON: ComparisonEntry[] = [
  {
    metric: "LCP",
    bad: 4800,
    optimized: 1200,
    unit: "ms",
    goodThreshold: 2500,
    poorThreshold: 4000,
  },
  {
    metric: "CLS",
    bad: 0.38,
    optimized: 0.02,
    unit: "",
    goodThreshold: 0.1,
    poorThreshold: 0.25,
  },
  {
    metric: "INP",
    bad: 620,
    optimized: 85,
    unit: "ms",
    goodThreshold: 200,
    poorThreshold: 500,
  },
  {
    metric: "FCP",
    bad: 3200,
    optimized: 800,
    unit: "ms",
    goodThreshold: 1800,
    poorThreshold: 3000,
  },
  {
    metric: "TTFB",
    bad: 1400,
    optimized: 180,
    unit: "ms",
    goodThreshold: 800,
    poorThreshold: 1800,
  },
];

// ─── Lighthouse scores ────────────────────────────────────────────────────────

export const MOCK_LIGHTHOUSE: LighthouseScore[] = [
  {
    page: "bad",
    performance: 23,
    accessibility: 72,
    bestPractices: 58,
    seo: 80,
    capturedAt: "2025-01-15T10:00:00Z",
  },
  {
    page: "optimized",
    performance: 97,
    accessibility: 98,
    bestPractices: 96,
    seo: 100,
    capturedAt: "2025-01-15T10:05:00Z",
  },
];

// ─── Bundle sizes ─────────────────────────────────────────────────────────────
// Bad: everything imported at top-level, no code splitting, raw images
// Optimised: dynamic imports, tree shaking, next/image, next/font

export const MOCK_BUNDLE_SIZES: BundleSize[] = [
  { page: "bad",       jsKb: 842, cssKb: 28, imageKb: 4200, totalKb: 5070 },
  { page: "optimized", jsKb: 124, cssKb: 18, imageKb:  280, totalKb:  422 },
];

// ─── Edge vs Origin latency ───────────────────────────────────────────────────

export const MOCK_LATENCY: LatencyResult[] = [
  {
    type: "edge",
    ttfbMs: 12,
    totalMs: 18,
    timestamp: new Date().toISOString(),
    region: "edge-iad-1",
  },
  {
    type: "origin",
    ttfbMs: 180,
    totalMs: 220,
    timestamp: new Date().toISOString(),
    region: "us-east-1",
  },
];

// ─── Historical trend (7 days of simulated data) ──────────────────────────────

export function generateTrend(
  metric: "LCP" | "CLS" | "INP",
  page: "bad" | "optimized"
): Array<{ day: string; value: number }> {
  const baseValues = {
    bad:       { LCP: 4800, CLS: 0.38, INP: 620 },
    optimized: { LCP: 1200, CLS: 0.02, INP: 85  },
  };
  const base = baseValues[page][metric];
  const jitter = base * 0.15;

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      day: d.toLocaleDateString("en-US", { weekday: "short" }),
      value: parseFloat((base + (Math.random() - 0.5) * jitter).toFixed(metric === "CLS" ? 3 : 0)),
    };
  });
}
