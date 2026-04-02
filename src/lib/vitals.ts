/**
 * Web Vitals instrumentation layer.
 *
 * Design decisions:
 * - Uses the official `web-vitals` library for LCP/CLS/INP/FCP/TTFB.
 * - Extends with PerformanceObserver for Long Tasks (not in web-vitals library).
 * - Navigation Timing API gives us detailed breakdown of the load pipeline.
 * - Reports to /api/vitals (fire-and-forget via sendBeacon).
 * - Writes to localStorage for the dashboard's historical view.
 *
 * WHY LONG TASKS MATTER (staff-level):
 * Long tasks (>50ms on the main thread) are the root cause of poor INP.
 * web-vitals reports the symptom (slow INP), but Long Tasks API tells you
 * WHICH script caused it — essential for debugging regressions in CI.
 *
 * WHY NAVIGATION TIMING MATTERS:
 * Navigation Timing gives you a full breakdown of TTFB into its components:
 *   DNS lookup + TCP connect + TLS + Request + Response
 * This tells you whether a slow TTFB is a CDN miss, a slow origin, or a
 * large HTML payload — you can't optimize what you can't measure.
 */

import type { Metric } from "web-vitals";
import type { MetricRating, VitalMetric, VitalsSnapshot } from "@/types/vitals";
import { dispatchVital } from "@/lib/analytics";

// ─── Thresholds ──────────────────────────────────────────────────────────────

const THRESHOLDS: Record<
  string,
  { good: number; poor: number; unit: string }
> = {
  LCP:  { good: 2500, poor: 4000, unit: "ms" },
  CLS:  { good: 0.1,  poor: 0.25, unit: "" },
  INP:  { good: 200,  poor: 500,  unit: "ms" },
  FCP:  { good: 1800, poor: 3000, unit: "ms" },
  TTFB: { good: 800,  poor: 1800, unit: "ms" },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function detectPage(): "bad" | "optimized" | "unknown" {
  if (typeof window === "undefined") return "unknown";
  const path = window.location.pathname;
  if (path.startsWith("/bad")) return "bad";
  if (path.startsWith("/optimized")) return "optimized";
  return "unknown";
}

function toRating(name: string, value: number): MetricRating {
  const t = THRESHOLDS[name];
  if (!t) return "needs-improvement";
  if (value <= t.good) return "good";
  if (value <= t.poor) return "needs-improvement";
  return "poor";
}

function toVitalMetric(metric: Metric): VitalMetric {
  return {
    name: metric.name as VitalMetric["name"],
    value: metric.value,
    rating: toRating(metric.name, metric.value) as MetricRating,
    timestamp: new Date().toISOString(),
    page: detectPage(),
  };
}

// ─── Storage ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = "fe-perf-lab:vitals";
const LONG_TASKS_KEY = "fe-perf-lab:long-tasks";
const NAV_TIMING_KEY = "fe-perf-lab:nav-timing";
const MAX_HISTORY = 100;

export function storeVital(metric: VitalMetric): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const history: VitalMetric[] = raw ? JSON.parse(raw) : [];
    history.push(metric);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(-MAX_HISTORY)));
  } catch {
    // localStorage may be unavailable in private-browsing modes
  }
}

export function loadVitalsHistory(): VitalMetric[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getLatestSnapshot(page: "bad" | "optimized"): VitalsSnapshot {
  const history = loadVitalsHistory().filter((v) => v.page === page);
  const latest = (name: VitalMetric["name"]) =>
    history.filter((v) => v.name === name).at(-1) ?? null;
  return {
    lcp:  latest("LCP"),
    cls:  latest("CLS"),
    inp:  latest("INP"),
    fcp:  latest("FCP"),
    ttfb: latest("TTFB"),
    capturedAt: new Date().toISOString(),
    page,
  };
}

export function clearVitalsHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LONG_TASKS_KEY);
    localStorage.removeItem(NAV_TIMING_KEY);
  } catch { /* noop */ }
}

// ─── Long Tasks ───────────────────────────────────────────────────────────────

export interface LongTask {
  duration: number;       // ms — always > 50
  startTime: number;      // ms from navigation start
  attribution: string;    // script URL or "unknown"
  page: string;
  timestamp: string;
}

export function loadLongTasks(): LongTask[] {
  try {
    const raw = localStorage.getItem(LONG_TASKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function storeLongTask(task: LongTask): void {
  try {
    const raw = localStorage.getItem(LONG_TASKS_KEY);
    const tasks: LongTask[] = raw ? JSON.parse(raw) : [];
    tasks.push(task);
    localStorage.setItem(LONG_TASKS_KEY, JSON.stringify(tasks.slice(-50)));
  } catch { /* noop */ }
}

/**
 * Observe Long Tasks (> 50ms on the main thread).
 *
 * Long tasks block the main thread and are the primary cause of poor INP.
 * The attribution entry tells you WHICH script caused the blockage:
 * - A vendor script → consider defer/async or removing it
 * - Your own code → profile it and optimise
 * - "unknown" → typically browser internals
 *
 * PerformanceObserver is non-blocking — it fires asynchronously after
 * the long task completes, so it doesn't add to the problem.
 */
function observeLongTasks(): void {
  if (!("PerformanceObserver" in window)) return;
  if (!PerformanceObserver.supportedEntryTypes.includes("longtask")) return;

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const longtask = entry as PerformanceEntry & {
        attribution?: Array<{ containerSrc?: string; containerName?: string }>;
      };

      const attribution =
        longtask.attribution?.[0]?.containerSrc ||
        longtask.attribution?.[0]?.containerName ||
        "unknown";

      const task: LongTask = {
        duration: Math.round(entry.duration),
        startTime: Math.round(entry.startTime),
        attribution,
        page: detectPage(),
        timestamp: new Date().toISOString(),
      };

      storeLongTask(task);

      if (process.env.NODE_ENV !== "production") {
        console.warn(
          `[perf] Long task detected: ${task.duration}ms from "${task.attribution}" on ${task.page}`
        );
      }
    }
  });

  observer.observe({ type: "longtask", buffered: true });
}

// ─── Navigation Timing ────────────────────────────────────────────────────────

export interface NavigationTimingBreakdown {
  dns: number;
  tcp: number;
  tls: number;
  request: number;     // Time waiting for first byte (server processing)
  response: number;    // Time downloading the response
  domParsing: number;  // HTML parse + resource discovery
  ttfb: number;        // Total TTFB (dns + tcp + tls + request)
  domInteractive: number;
  domComplete: number;
  page: string;
  timestamp: string;
}

export function loadNavigationTiming(): NavigationTimingBreakdown | null {
  try {
    const raw = localStorage.getItem(NAV_TIMING_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Capture Navigation Timing API data after the page loads.
 *
 * This gives us a full pipeline breakdown:
 *   DNS → TCP → TLS → Request → Response → DOM parse → DOM interactive
 *
 * Staff-level use cases:
 * 1. "Our TTFB is 800ms — is it DNS (CDN miss) or server processing?"
 *    → dns=10ms, tcp=15ms, tls=20ms, request=750ms → server is the bottleneck
 *
 * 2. "Our LCP is 3s but TTFB is 200ms — where's the time going?"
 *    → domParsing=2800ms → we have render-blocking scripts
 *
 * Fires on 'load' so we capture the full picture after all resources load.
 */
function captureNavigationTiming(): void {
  const capture = () => {
    const [nav] = performance.getEntriesByType(
      "navigation"
    ) as PerformanceNavigationTiming[];
    if (!nav) return;

    const breakdown: NavigationTimingBreakdown = {
      dns:             Math.round(nav.domainLookupEnd  - nav.domainLookupStart),
      tcp:             Math.round(nav.connectEnd        - nav.connectStart),
      tls:             nav.secureConnectionStart > 0
                         ? Math.round(nav.connectEnd   - nav.secureConnectionStart)
                         : 0,
      request:         Math.round(nav.responseStart    - nav.requestStart),
      response:        Math.round(nav.responseEnd      - nav.responseStart),
      domParsing:      Math.round(nav.domInteractive   - nav.responseEnd),
      ttfb:            Math.round(nav.responseStart    - nav.startTime),
      domInteractive:  Math.round(nav.domInteractive   - nav.startTime),
      domComplete:     Math.round(nav.domComplete      - nav.startTime),
      page:            detectPage(),
      timestamp:       new Date().toISOString(),
    };

    try {
      localStorage.setItem(NAV_TIMING_KEY, JSON.stringify(breakdown));
    } catch { /* noop */ }

    if (process.env.NODE_ENV !== "production") {
      console.table({
        "DNS":            `${breakdown.dns}ms`,
        "TCP":            `${breakdown.tcp}ms`,
        "TLS":            `${breakdown.tls}ms`,
        "Server (TTFB)":  `${breakdown.request}ms`,
        "Response DL":    `${breakdown.response}ms`,
        "DOM parse":      `${breakdown.domParsing}ms`,
        "DOM interactive":`${breakdown.domInteractive}ms`,
        "DOM complete":   `${breakdown.domComplete}ms`,
      });
    }
  };

  // 'load' fires after all resources — navigation timing is fully populated
  if (document.readyState === "complete") {
    capture();
  } else {
    window.addEventListener("load", capture, { once: true });
  }
}

// ─── Reporter ─────────────────────────────────────────────────────────────────

async function sendToAnalytics(vital: VitalMetric): Promise<void> {
  const body = JSON.stringify(vital);
  const url = "/api/vitals";

  if (navigator.sendBeacon) {
    navigator.sendBeacon(url, new Blob([body], { type: "application/json" }));
  } else {
    fetch(url, {
      method: "POST",
      body,
      headers: { "Content-Type": "application/json" },
      keepalive: true,
    }).catch(() => { /* analytics must never crash the app */ });
  }
}

// ─── Main init ───────────────────────────────────────────────────────────────

/**
 * Call once from VitalsReporter (Client Component in root layout).
 * Registers all performance observers — runs entirely in the browser.
 */
export async function initVitals(): Promise<void> {
  const { onLCP, onCLS, onINP, onFCP, onTTFB } = await import("web-vitals");

  const handle = (metric: Metric) => {
    const vital = toVitalMetric(metric);
    storeVital(vital);
    sendToAnalytics(vital);   // beacon → /api/vitals
    dispatchVital(vital);     // GA4 + Amplitude + Sentry (no-op without env vars)
    if (process.env.NODE_ENV !== "production") {
      (window as unknown as Record<string, unknown>)[`__perf_${metric.name}`] = vital;
    }
  };

  // reportAllChanges on INP: capture every interaction, not just the worst at unload
  onLCP(handle);
  onCLS(handle);
  onINP(handle, { reportAllChanges: true });
  onFCP(handle);
  onTTFB(handle);

  // Extend with platform APIs not covered by web-vitals library
  observeLongTasks();
  captureNavigationTiming();
}

// ─── Formatting helpers ───────────────────────────────────────────────────────

export function formatMetricValue(name: string, value: number): string {
  const t = THRESHOLDS[name];
  if (!t) return String(value);
  if (name === "CLS") return value.toFixed(3);
  return `${Math.round(value)}ms`;
}

export function getRatingColor(rating: MetricRating): string {
  return {
    good: "var(--good)",
    "needs-improvement": "var(--warn)",
    poor: "var(--bad)",
  }[rating];
}

export { THRESHOLDS };
