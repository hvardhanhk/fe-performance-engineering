/**
 * In-process rate limiter using a sliding window algorithm.
 *
 * PRODUCTION NOTE:
 * This implementation stores state in the Node.js process heap.
 * In a multi-instance deployment (Kubernetes, ECS, Vercel serverless) each
 * instance has its own counter — the effective limit per IP is
 *   actual_limit × number_of_instances
 *
 * For true per-IP rate limiting across instances use:
 *   - Upstash Redis (serverless, works in Edge Runtime)
 *   - Vercel KV (same underlying technology)
 *   - Redis + ioredis (for traditional Node.js deployments)
 *
 * For the performance lab this in-process version is sufficient and
 * demonstrates the pattern without requiring external infrastructure.
 *
 * ALGORITHM — Sliding Window:
 * Better than Fixed Window (token bucket) because it doesn't allow
 * a burst of 2× limit straddling a window boundary. For each IP we
 * store the timestamps of all requests in the current window and
 * evict those older than windowMs.
 *
 * TIME COMPLEXITY: O(n) per request where n = requests in window.
 * For typical limits (100 req/min) this is negligible.
 *
 * MEMORY: Each IP entry holds at most `limit` timestamps (~8 bytes each).
 * 10,000 IPs × 100 timestamps × 8 bytes = ~8MB. Acceptable.
 * The cleanup interval purges entries with no recent requests.
 */

interface RateLimitEntry {
  timestamps: number[];
  blockedUntil: number; // 0 = not blocked
}

const store = new Map<string, RateLimitEntry>();

// Cleanup stale entries every 5 minutes to avoid unbounded memory growth
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (entry.blockedUntil < now && entry.timestamps.length === 0) {
        store.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

export interface RateLimitResult {
  success: boolean;        // true = request allowed
  limit: number;           // configured max requests
  remaining: number;       // requests left in this window
  resetAt: number;         // unix ms when the window resets
  retryAfter?: number;     // ms to wait if blocked
}

export interface RateLimitConfig {
  /** Max requests per windowMs */
  limit: number;
  /** Window size in ms (default: 60000 = 1 minute) */
  windowMs?: number;
  /** How long to block after limit exceeded in ms (default: windowMs) */
  blockDurationMs?: number;
}

/**
 * Check and increment the rate limit for a given identifier (typically IP).
 *
 * Usage:
 *   const result = rateLimit(request.ip ?? "unknown", { limit: 100 });
 *   if (!result.success) {
 *     return new Response("Too Many Requests", {
 *       status: 429,
 *       headers: { "Retry-After": String(Math.ceil(result.retryAfter! / 1000)) }
 *     });
 *   }
 */
export function rateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const { limit, windowMs = 60_000, blockDurationMs = windowMs } = config;
  const now = Date.now();
  const windowStart = now - windowMs;

  let entry = store.get(identifier);

  if (!entry) {
    entry = { timestamps: [], blockedUntil: 0 };
    store.set(identifier, entry);
  }

  // Check if currently in a block period
  if (entry.blockedUntil > now) {
    return {
      success: false,
      limit,
      remaining: 0,
      resetAt: entry.blockedUntil,
      retryAfter: entry.blockedUntil - now,
    };
  }

  // Evict timestamps outside the current window (sliding window)
  entry.timestamps = entry.timestamps.filter((t) => t > windowStart);

  // Check limit
  if (entry.timestamps.length >= limit) {
    // Block until blockDurationMs after the oldest request in window
    entry.blockedUntil = (entry.timestamps[0] ?? now) + blockDurationMs;
    return {
      success: false,
      limit,
      remaining: 0,
      resetAt: entry.blockedUntil,
      retryAfter: entry.blockedUntil - now,
    };
  }

  // Allow — record this request
  entry.timestamps.push(now);

  return {
    success: true,
    limit,
    remaining: limit - entry.timestamps.length,
    resetAt: windowStart + windowMs,
  };
}

/**
 * Extract the client IP from a Next.js request.
 * Respects Vercel/Cloudflare forwarding headers.
 *
 * Security note: x-forwarded-for can be spoofed by clients.
 * In production use the header only if your reverse proxy (Vercel, CloudFront)
 * sets it — never trust it if traffic can reach your origin directly.
 */
export function getClientIp(req: { headers: { get(k: string): string | null } }): string {
  return (
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}
