/**
 * GET /api/origin-latency
 *
 * Simulates a response from an origin server (Node.js runtime).
 * Origin servers are typically 150–400ms from the user because:
 * 1. They are deployed in a single region (not at CDN PoPs)
 * 2. Container cold starts can add 200–2000ms on the first request
 * 3. All requests traverse the full internet path to the datacenter
 *
 * We simulate this with a 180ms artificial delay.
 */

import { NextRequest, NextResponse } from "next/server";
import type { LatencyResult } from "@/types/vitals";

// Typical origin latency in a single-region deployment (US East → global user)
const SIMULATED_ORIGIN_DELAY_MS = 180;

export async function GET(_req: NextRequest): Promise<NextResponse> {
  const start = Date.now();
  await new Promise((r) => setTimeout(r, SIMULATED_ORIGIN_DELAY_MS));

  const result: LatencyResult = {
    type: "origin",
    ttfbMs: Date.now() - start,
    totalMs: Date.now() - start,
    timestamp: new Date().toISOString(),
    region: process.env.VERCEL_REGION ?? process.env.AWS_REGION ?? "us-east-1",
  };

  const response = NextResponse.json(result);
  response.headers.set("Cache-Control", "no-store");
  return response;
}
