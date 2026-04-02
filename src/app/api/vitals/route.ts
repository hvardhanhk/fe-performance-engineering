/**
 * POST /api/vitals
 *
 * Analytics collector for Core Web Vitals.
 * In production this would forward to a real analytics backend
 * (BigQuery, ClickHouse, Amplitude, Sentry).
 *
 * SECURITY:
 * - Rate limited: 300 req/min per IP (analytics endpoints get hit on every page load)
 * - Payload validated before processing
 * - Secure headers set globally via next.config.ts
 *
 * RATE LIMIT CHOICE (300/min):
 * A single user session sends ≤5 metrics per page load (LCP, CLS, INP, FCP, TTFB).
 * 300/min allows 60 page loads/min per IP — generous for legit usage,
 * prevents abuse bots from flooding the collector.
 */

import { NextRequest, NextResponse } from "next/server";
import type { VitalMetric } from "@/types/vitals";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { sendVitalToSentry } from "@/lib/analytics";

const VALID_NAMES = new Set(["LCP", "CLS", "INP", "FCP", "TTFB"]);

export async function POST(req: NextRequest): Promise<NextResponse> {
  // ── Rate limiting ──────────────────────────────────────────────────────────
  const ip = getClientIp(req);
  const rl = rateLimit(ip, { limit: 300, windowMs: 60_000 });

  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((rl.retryAfter ?? 60_000) / 1000)),
          "X-RateLimit-Limit":     String(rl.limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset":     String(rl.resetAt),
        },
      }
    );
  }

  // ── Payload validation ─────────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const metric = body as Partial<VitalMetric>;
  if (
    !metric.name ||
    !VALID_NAMES.has(metric.name) ||
    typeof metric.value !== "number" ||
    !isFinite(metric.value)
  ) {
    return NextResponse.json({ error: "Invalid metric payload" }, { status: 422 });
  }

  // ── Logging ────────────────────────────────────────────────────────────────
  if (process.env.NODE_ENV === "development") {
    console.log(
      `[vitals] ${metric.name}=${metric.value} rating=${metric.rating} page=${metric.page}`
    );
  }

  // ── Analytics forwarding ───────────────────────────────────────────────────
  // Sentry: alert on poor-rated metrics (server-side path, no-op without DSN).
  // GA4 + Amplitude are browser-side only (wired in src/lib/vitals.ts via dispatchVital).
  sendVitalToSentry(metric as VitalMetric);

  /*
   * PRODUCTION INTEGRATION POINTS (replace stubs in src/lib/analytics.ts):
   * - GA4:       window.gtag("event", "web_vitals", { ... })     [browser, in vitals.ts]
   * - Amplitude: amplitude.track("Core Web Vital", { ... })      [browser, in vitals.ts]
   * - Sentry:    Sentry.captureEvent({ level: "warning", ... })  [server + browser]
   * - BigQuery:  await bigquery.dataset("perf").table("vitals").insert([metric])
   * - ClickHouse: await ch.insert({ table: "vitals", values: [metric] })
   */

  const response = NextResponse.json({ ok: true }, { status: 202 });
  response.headers.set("X-RateLimit-Limit",     String(rl.limit));
  response.headers.set("X-RateLimit-Remaining", String(rl.remaining));
  response.headers.set("X-RateLimit-Reset",     String(rl.resetAt));
  return response;
}
