/**
 * GET /api/edge-latency
 *
 * Simulates a response from an edge worker.
 * In production this would be deployed as a Vercel Edge Function or
 * Cloudflare Worker — running at the CDN PoP closest to the user.
 *
 * Key characteristics of edge responses:
 * - No cold start (V8 isolate, not a container)
 * - TTFB typically 5–30ms from the user's nearest PoP
 * - Limited to Web API surface (no Node.js builtins)
 *
 * Note: We export `runtime = 'edge'` to run this on Vercel Edge Runtime.
 * When running locally with `next dev`, it still runs in Node but the
 * instrumentation pattern is the same.
 */

import { NextRequest, NextResponse } from "next/server";
import type { LatencyResult } from "@/types/vitals";

export const runtime = "edge";

export async function GET(_req: NextRequest): Promise<NextResponse> {
  const start = Date.now();

  // Edge functions respond quickly — simulate ~5ms of computation
  await new Promise((r) => setTimeout(r, 5));

  const result: LatencyResult = {
    type: "edge",
    ttfbMs: Date.now() - start,
    totalMs: Date.now() - start,
    timestamp: new Date().toISOString(),
    region: (globalThis as Record<string, unknown>).EdgeRuntime
      ? "edge"
      : (process.env.VERCEL_REGION ?? "local-edge"),
  };

  const response = NextResponse.json(result);
  // Edge responses should not be cached — we want fresh timing data each time
  response.headers.set("Cache-Control", "no-store");
  return response;
}
