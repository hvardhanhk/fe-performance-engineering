/**
 * /dashboard loading.tsx
 *
 * The dashboard's initial shell (header + nav cards) is server-rendered
 * immediately. The heavy chart components (DashboardClient) stream in
 * once they hydrate. This loading state covers the Suspense boundary
 * wrapping DashboardClient.
 */

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-[--background] text-[--foreground]">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">

        <div className="space-y-2">
          <div className="skeleton h-9 w-56 rounded" />
          <div className="skeleton h-5 w-96 rounded" />
        </div>

        {/* Navigation cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="card">
              <div className="skeleton h-5 w-32 rounded mb-2" />
              <div className="skeleton h-4 w-full rounded" />
            </div>
          ))}
        </div>

        {/* Tabs skeleton */}
        <div className="flex gap-2 border-b border-[--border] pb-4">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="skeleton h-8 w-28 rounded" />
          ))}
        </div>

        {/* Chart placeholder — exact height prevents CLS */}
        <div className="card space-y-3">
          <div className="skeleton h-5 w-48 rounded" />
          <div className="skeleton h-64 w-full rounded" />
        </div>
      </div>
    </div>
  );
}
