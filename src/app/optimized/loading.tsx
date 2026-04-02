/**
 * /optimized loading.tsx — Next.js App Router streaming skeleton.
 *
 * WHY THIS MATTERS (staff-level insight):
 *
 * Next.js wraps every page in an implicit <Suspense> boundary keyed to
 * the loading.tsx file. This means:
 *
 * 1. The server sends the shell (Nav, layout) IMMEDIATELY with a 200 status.
 *    The browser can start rendering and downloading fonts/CSS while the
 *    page's async data fetch is still running on the server.
 *
 * 2. When the data resolves, the server streams the real content as an
 *    out-of-order chunk. React on the client swaps the skeleton in-place.
 *
 * 3. Because the skeleton has the SAME dimensions as the real content,
 *    the swap causes zero layout shift (CLS = 0).
 *
 * Without loading.tsx:
 *   - User stares at blank page until ALL data fetches complete → high LCP
 *   - TTFB is technically fast but perceived load is slow (blank screen)
 *
 * With loading.tsx:
 *   - User sees skeleton within ~50ms (edge cache) or ~200ms (origin)
 *   - Perceived performance dramatically improves even if real LCP is similar
 *
 * This is the difference between a 0.5s "blank wait" and a 0.5s "content
 * appearing progressively" — measurably better in user satisfaction studies.
 */

export default function OptimizedLoading() {
  return (
    <div className="min-h-screen bg-[--background] text-[--foreground]">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">

        {/* Header skeleton */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="skeleton h-9 w-9 rounded" />
            <div className="skeleton h-9 w-64 rounded" />
          </div>
          <div className="skeleton h-5 w-96 rounded" />
        </div>

        {/* Vitals panel skeleton — exact same height as VitalsPanel */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="skeleton h-4 w-40 rounded" />
            <div className="skeleton h-4 w-12 rounded" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-6">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="flex flex-col gap-1">
                <div className="skeleton h-3 w-10 rounded" />
                <div className="skeleton h-8 w-20 rounded" />
                <div className="skeleton h-3 w-14 rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Optimisation cards skeleton */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }, (_, i) => (
            <div key={i} className="card">
              <div className="flex items-start gap-2">
                <div className="skeleton h-6 w-6 rounded shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="skeleton h-4 w-32 rounded" />
                  <div className="skeleton h-3 w-full rounded" />
                  <div className="skeleton h-5 w-24 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Image grid skeleton — reserved dimensions prevent CLS */}
        <div className="card space-y-4">
          <div className="skeleton h-6 w-72 rounded" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="aspect-[4/3] skeleton rounded" />
            ))}
          </div>
        </div>

        {/* List skeleton */}
        <div className="card space-y-4">
          <div className="skeleton h-6 w-80 rounded" />
          <div className="skeleton h-10 w-full rounded" />
          <div className="space-y-1">
            {Array.from({ length: 7 }, (_, i) => (
              <div key={i} className="px-3 py-3 rounded bg-[--surface-hover]">
                <div className="skeleton h-4 w-3/4 rounded mb-1" />
                <div className="skeleton h-3 w-full rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
