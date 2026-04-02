"use client";

/**
 * LazyChart — dynamically imports recharts only when the component
 * enters the viewport (IntersectionObserver via react-intersection-observer).
 *
 * WHY THIS MATTERS FOR BUNDLE SIZE:
 * recharts is ~120KB gzipped. If we import it at the top of the page module,
 * it lands in the initial JS bundle → increases parse time → delays FCP/LCP.
 * By deferring to IntersectionObserver, the initial bundle stays lean.
 *
 * The Suspense boundary in the parent renders a skeleton until ready → no CLS.
 */

import { useState, useEffect, useRef } from "react";

// Chart data — generated once, not on every render
const CHART_DATA = Array.from({ length: 20 }, (_, i) => ({
  name: `T${i}`,
  optimized: Math.round(50 + Math.random() * 50),
  bad: Math.round(200 + Math.random() * 400),
}));

export function LazyChart() {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [Chart, setChart] = useState<React.ComponentType<{ data: typeof CHART_DATA }> | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" } // pre-load 200px before entering viewport
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    // ✅ Dynamic import: recharts only enters the bundle when this runs
    import("./ChartInner").then((mod) => {
      setChart(() => mod.ChartInner);
    });
  }, [isVisible]);

  return (
    <div ref={ref} style={{ height: 220 }}>
      {Chart ? (
        <Chart data={CHART_DATA} />
      ) : (
        // ✅ Skeleton with reserved height — prevents CLS while loading
        <div className="skeleton h-full w-full rounded" />
      )}
    </div>
  );
}
