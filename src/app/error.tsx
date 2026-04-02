"use client";

/**
 * Global error boundary — catches unhandled errors thrown during rendering.
 *
 * STAFF-LEVEL INSIGHT: Error boundaries are a performance concern, not just UX.
 *
 * Without an error boundary:
 * - A thrown error in any server component crashes the entire page → blank screen
 * - The blank screen looks like a performance problem (LCP = never)
 * - Sentry / analytics never captures the error (user just sees blank page)
 *
 * With an error boundary:
 * - Only the erroring subtree fails; the rest of the page remains functional
 * - The error is captured and reported (Sentry / /api/vitals)
 * - The user can attempt recovery without a full reload
 *
 * This component receives `error` (the thrown value) and `reset` (retry function).
 * It must be a Client Component — error boundaries cannot be Server Components.
 *
 * PRODUCTION INTEGRATION:
 * Add `Sentry.captureException(error)` here to forward to your error tracker.
 */

import { useEffect } from "react";

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    // PRODUCTION: Sentry.captureException(error);
    console.error("[error boundary]", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="card max-w-md w-full space-y-4 border-[--bad]/30">
        <div className="flex items-center gap-3">
          <span className="text-3xl">💥</span>
          <div>
            <h2 className="text-lg font-semibold">Something went wrong</h2>
            <p className="text-sm text-[--foreground]/50">
              {error.message || "An unexpected error occurred"}
            </p>
          </div>
        </div>

        {error.digest && (
          <p className="text-xs text-[--foreground]/30 font-mono">
            Error ID: {error.digest}
          </p>
        )}

        <div className="flex gap-3">
          <button
            onClick={reset}
            className="px-4 py-2 rounded bg-[--accent] hover:bg-[--accent-hover] text-white text-sm font-medium transition-colors"
          >
            Try again
          </button>
          <a
            href="/"
            className="px-4 py-2 rounded bg-[--surface-hover] text-sm font-medium transition-colors"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}
