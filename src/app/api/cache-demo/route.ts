/**
 * GET /api/cache-demo
 *
 * Demonstrates CDN caching behaviour.
 *
 * Without ?bust=1 → Cache HIT (fast, cached response)
 * With ?bust=1    → Cache MISS (slow, origin processing)
 *
 * SECURITY:
 * - Rate limited: 60 req/min per IP (low — this endpoint simulates
 *   expensive origin work; don't let it be abused as a timing attack)
 */

import { NextRequest, NextResponse } from "next/server";
import type { CacheDemoResult } from "@/types/vitals";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const ORIGIN_DELAY_MS = 220;

export async function GET(req: NextRequest): Promise<NextResponse> {
  // ── Rate limiting ──────────────────────────────────────────────────────────
  const ip = getClientIp(req);
  const rl = rateLimit(ip, { limit: 60, windowMs: 60_000 });

  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil((rl.retryAfter ?? 60_000) / 1000)) },
      }
    );
  }

  // ── Cache demo logic ───────────────────────────────────────────────────────
  const bust = req.nextUrl.searchParams.has("bust");
  const serverStart = Date.now();

  if (bust) {
    await new Promise((r) => setTimeout(r, ORIGIN_DELAY_MS));
  }

  const responseTimeMs = Date.now() - serverStart;

  const result: CacheDemoResult = {
    cacheStatus: bust ? "MISS" : "HIT",
    responseTimeMs,
    timestamp: new Date().toISOString(),
    serverRegion: process.env.VERCEL_REGION ?? process.env.AWS_REGION ?? "local",
    headers: {
      "Cache-Control": bust ? "no-store" : "public, s-maxage=30, stale-while-revalidate=120",
      "X-Cache": bust ? "MISS" : "HIT",
      "X-Response-Time": `${responseTimeMs}ms`,
    },
  };

  const response = NextResponse.json(result);

  if (bust) {
    response.headers.set("Cache-Control", "no-store");
    response.headers.set("X-Cache", "MISS");
  } else {
    response.headers.set("Cache-Control", "public, s-maxage=30, stale-while-revalidate=120");
    response.headers.set("X-Cache", "HIT");
  }

  response.headers.set("X-Response-Time", `${responseTimeMs}ms`);
  response.headers.set("X-RateLimit-Remaining", String(rl.remaining));

  return response;
}
