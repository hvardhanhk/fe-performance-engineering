/**
 * Next.js Edge Middleware
 *
 * Runs at the CDN edge before the request reaches the origin server.
 * This is the fastest possible interception point — no container startup.
 *
 * WHAT THIS MIDDLEWARE DOES:
 *
 * 1. Geo-based personalisation header:
 *    Reads the user's country from Vercel's geo headers and injects
 *    `x-user-country` into the request. Downstream components can read
 *    this without another API call — zero extra latency.
 *
 * 2. Performance timing header:
 *    Stamps `x-middleware-start` so the response can report how long
 *    middleware processing took. Used by the latency demo.
 *
 * 3. /bad → rate limit header:
 *    Adds a header that the /bad page can read to demonstrate how
 *    edge middleware can protect expensive routes.
 *
 * WHY EDGE MIDDLEWARE (vs API routes)?
 * - Runs before the response is generated → can modify headers, redirect, rewrite
 * - No cold start → <1ms overhead
 * - Runs in the Vercel Edge Network (150+ PoPs) → global low-latency
 * - Tradeoff: 1MB code limit, no Node.js APIs, no database connections
 */

import { NextRequest, NextResponse } from "next/server";

export const config = {
  // Only run on application routes — not on static assets or API routes
  // that have their own timing headers
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/).*)",
  ],
};

export default function middleware(req: NextRequest): NextResponse {
  const start = Date.now();
  const response = NextResponse.next();

  // 1. Geo header — Vercel populates req.geo in production
  const country =
    (req.headers.get("x-vercel-ip-country") as string | null) ??
    "unknown";
  response.headers.set("x-user-country", country);

  // 2. Middleware timing — useful for observability / Edge vs Origin demo
  response.headers.set("x-middleware-start", String(start));
  response.headers.set(
    "x-middleware-duration",
    `${Date.now() - start}ms`
  );

  // 3. Mark the response as edge-processed
  response.headers.set("x-served-by", "edge-middleware");

  // 4. Add a Vary header so CDN caches are partitioned by country
  //    without this, a UK user could get a US-personalised cached response
  if (country !== "unknown") {
    response.headers.set("Vary", "x-vercel-ip-country");
  }

  return response;
}
