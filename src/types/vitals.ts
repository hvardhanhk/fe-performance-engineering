/**
 * Canonical types for Core Web Vitals throughout the app.
 *
 * Why these thresholds?
 * Google's "good" / "needs improvement" / "poor" cuts are:
 *   LCP:  good < 2500ms,  poor > 4000ms
 *   CLS:  good < 0.1,     poor > 0.25
 *   INP:  good < 200ms,   poor > 500ms
 *   FCP:  good < 1800ms,  poor > 3000ms
 *   TTFB: good < 800ms,   poor > 1800ms
 */

export type MetricRating = "good" | "needs-improvement" | "poor";

export interface VitalMetric {
  name: "LCP" | "CLS" | "INP" | "FCP" | "TTFB";
  value: number;
  rating: MetricRating;
  /** ISO timestamp of when this metric was captured */
  timestamp: string;
  /** Which page variant produced this metric */
  page: "bad" | "optimized" | "unknown";
}

export interface VitalsSnapshot {
  lcp: VitalMetric | null;
  cls: VitalMetric | null;
  inp: VitalMetric | null;
  fcp: VitalMetric | null;
  ttfb: VitalMetric | null;
  capturedAt: string;
  page: "bad" | "optimized" | "unknown";
}

export interface ComparisonEntry {
  metric: "LCP" | "CLS" | "INP" | "FCP" | "TTFB";
  bad: number | null;
  optimized: number | null;
  unit: string;
  goodThreshold: number;
  poorThreshold: number;
}

/** Shape returned by /api/cache-demo */
export interface CacheDemoResult {
  cacheStatus: "HIT" | "MISS";
  responseTimeMs: number;
  timestamp: string;
  serverRegion: string;
  headers: Record<string, string>;
}

/** Shape returned by /api/edge-latency and /api/origin-latency */
export interface LatencyResult {
  type: "edge" | "origin";
  ttfbMs: number;
  totalMs: number;
  timestamp: string;
  region: string;
}

/** Lightweight Lighthouse score payload (mocked / CI artifact) */
export interface LighthouseScore {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
  page: "bad" | "optimized";
  capturedAt: string;
}

/** Bundle size data for the comparison chart */
export interface BundleSize {
  page: "bad" | "optimized";
  jsKb: number;
  cssKb: number;
  imageKb: number;
  totalKb: number;
}
