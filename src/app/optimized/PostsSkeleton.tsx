/**
 * PostsSkeleton — Server Component.
 *
 * WHY THIS PREVENTS CLS:
 * The skeleton reserves exactly the same vertical space as the real content.
 * When the Suspense boundary resolves, the swap is in-place — no shift.
 * Width/height are hard-coded to match the real list item heights.
 */
export function PostsSkeleton() {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Loading posts">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="flex flex-col gap-1 px-3 py-3 rounded bg-[--surface-hover]">
          {/* Title skeleton — matches real title height */}
          <div className="skeleton h-4 w-3/4 rounded" />
          {/* Body skeleton */}
          <div className="skeleton h-3 w-full rounded" />
          <div className="skeleton h-3 w-2/3 rounded" />
        </div>
      ))}
    </div>
  );
}
