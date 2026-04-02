/**
 * Analytics integration stubs — GA4, Amplitude, Sentry.
 *
 * All three are no-ops when the corresponding env var is absent,
 * so the app runs identically in development without any external keys.
 *
 * ENVIRONMENT VARIABLES:
 *   NEXT_PUBLIC_GA4_MEASUREMENT_ID   — e.g. "G-XXXXXXXXXX"
 *   NEXT_PUBLIC_AMPLITUDE_API_KEY    — e.g. "abc123def456"
 *   NEXT_PUBLIC_SENTRY_DSN           — e.g. "https://xxx@oXXX.ingest.sentry.io/XXX"
 *
 * BROWSER vs SERVER:
 *   - sendVitalToGA4 / sendVitalToAmplitude run in the browser (called from vitals.ts).
 *   - sendVitalToSentry can run on either side (called from /api/vitals for server-side
 *     alerting on poor-rated metrics, and from the browser error boundary).
 *
 * PRODUCTION INTEGRATION:
 *   Replace the stubs below with real SDK calls:
 *     GA4:       window.gtag("event", ...)        — already wired via <Script> in layout
 *     Amplitude: amplitude.track(...)              — import @amplitude/analytics-browser
 *     Sentry:    Sentry.captureEvent(...)          — import @sentry/nextjs
 */

import type { VitalMetric } from "@/types/vitals";

// ─── Type augmentation ────────────────────────────────────────────────────────

/**
 * gtag is injected by the GA4 <Script> tag. Augment window so TypeScript
 * knows it exists without installing the @types/gtag.js package.
 */
declare global {
  interface Window {
    gtag?: (
      command: "config" | "event" | "js" | "set",
      targetId: string | Date,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      params?: Record<string, any>
    ) => void;
    amplitude?: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      track: (eventName: string, eventProperties?: Record<string, any>) => void;
    };
  }
}

// ─── GA4 ──────────────────────────────────────────────────────────────────────

/**
 * Send a Core Web Vital to Google Analytics 4 as a custom event.
 *
 * Event schema follows the recommended CWV reporting convention:
 *   event_name: "web_vitals"
 *   metric_name: "LCP" | "CLS" | "INP" | "FCP" | "TTFB"
 *   value: raw numeric value (ms or unitless)
 *   rating: "good" | "needs-improvement" | "poor"
 *   page: pathname where the metric was captured
 *   delta: change since the last reported value (INP only)
 *
 * GA4 exploration query example:
 *   SELECT metric_name, AVG(value) FROM events WHERE event_name = "web_vitals"
 *   GROUP BY metric_name
 *
 * Only fires when NEXT_PUBLIC_GA4_MEASUREMENT_ID is set AND window.gtag exists.
 * The gtag function is injected by the <Script> tag in layout.tsx.
 */
export function sendVitalToGA4(metric: VitalMetric): void {
  if (!process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID) return;
  if (typeof window === "undefined" || !window.gtag) return;

  window.gtag("event", "web_vitals", {
    metric_name: metric.name,
    value: Math.round(metric.name === "CLS" ? metric.value * 1000 : metric.value),
    rating: metric.rating,
    page: metric.page,
    // Custom dimension — lets you filter by page template in GA4 Explorations
    page_template: document.querySelector("meta[name=page-template]")?.getAttribute("content") ?? "default",
  });
}

// ─── Amplitude ────────────────────────────────────────────────────────────────

/**
 * Send a Core Web Vital to Amplitude as a tracked event.
 *
 * Uses the browser SDK's global `amplitude.track()` which is available after
 * the Amplitude snippet or @amplitude/analytics-browser SDK is initialised.
 *
 * To enable: add the Amplitude Browser SDK to layout.tsx (or use their CDN
 * snippet), call amplitude.init(NEXT_PUBLIC_AMPLITUDE_API_KEY), then metrics
 * will flow automatically when this env var is present.
 *
 * Amplitude chart recipe:
 *   Event: "Core Web Vital" → filter by "metric_name" = "LCP"
 *   Group by "rating" → see good/needs-improvement/poor distribution over time
 */
export function sendVitalToAmplitude(metric: VitalMetric): void {
  if (!process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY) return;
  if (typeof window === "undefined" || !window.amplitude) return;

  window.amplitude.track("Core Web Vital", {
    metric_name: metric.name,
    value: metric.value,
    rating: metric.rating,
    page: metric.page,
  });
}

// ─── Sentry ───────────────────────────────────────────────────────────────────

/**
 * Forward poor-rated metrics to Sentry as performance events.
 *
 * Only "poor" metrics are sent — this keeps Sentry event volume low
 * (< 5% of sessions typically) while still alerting on real regressions.
 *
 * PRODUCTION WIRING:
 *   1. npm install @sentry/nextjs
 *   2. Run `npx @sentry/wizard@latest -i nextjs` to generate sentry.client.config.ts
 *   3. Replace the console.warn below with:
 *        import * as Sentry from "@sentry/nextjs";
 *        Sentry.captureEvent({ message: `Poor ${metric.name}`, level: "warning", extra: metric });
 *
 * This function is safe to call from both server and browser — it guards on
 * NEXT_PUBLIC_SENTRY_DSN before doing anything.
 */
export function sendVitalToSentry(metric: VitalMetric): void {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;
  if (metric.rating !== "poor") return;

  // PRODUCTION: replace with Sentry.captureEvent(...)
  // import * as Sentry from "@sentry/nextjs";
  // Sentry.captureEvent({
  //   message: `Poor ${metric.name}: ${metric.value}`,
  //   level: "warning",
  //   extra: { metric },
  //   tags: { metric_name: metric.name, page: metric.page ?? "unknown" },
  // });

  // Dev/stub: log so you can see what would be sent to Sentry
  if (process.env.NODE_ENV !== "production") {
    console.warn(
      `[Sentry stub] Poor ${metric.name}=${metric.value} on ${metric.page ?? "unknown page"} — would send to Sentry in production`
    );
  }
}

// ─── Combined dispatcher ──────────────────────────────────────────────────────

/**
 * Send a vital to all configured analytics providers in one call.
 *
 * Usage (browser):
 *   import { dispatchVital } from "@/lib/analytics";
 *   dispatchVital(metric);  // inside initVitals() handler
 *
 * Each provider is independently no-op when its env var is absent —
 * you can enable GA4 without Amplitude, etc.
 */
export function dispatchVital(metric: VitalMetric): void {
  sendVitalToGA4(metric);
  sendVitalToAmplitude(metric);
  sendVitalToSentry(metric);
}
