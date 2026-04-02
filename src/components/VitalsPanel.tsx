"use client";

/**
 * VitalsPanel — live-updating Core Web Vitals display.
 *
 * Polls localStorage every 2 seconds so the panel stays fresh as the user
 * interacts with the page. A real production system would use a WebSocket
 * or Server-Sent Events; localStorage polling is sufficient for a demo lab
 * without introducing infrastructure complexity.
 *
 * Why Client Component?
 * - Needs useState + useEffect for live updates
 * - Reads localStorage (browser API)
 */

import { useEffect, useState } from "react";
import { getLatestSnapshot } from "@/lib/vitals";
import { MetricBadge } from "./MetricBadge";
import type { VitalsSnapshot } from "@/types/vitals";

interface Props {
  page: "bad" | "optimized";
}

export function VitalsPanel({ page }: Props) {
  const [snapshot, setSnapshot] = useState<VitalsSnapshot | null>(null);

  useEffect(() => {
    // Initial read
    setSnapshot(getLatestSnapshot(page));

    // Poll for updates — captures metrics as user interacts
    const id = setInterval(() => {
      setSnapshot(getLatestSnapshot(page));
    }, 2000);

    return () => clearInterval(id);
  }, [page]);

  const metrics = [
    { name: "LCP",  metric: snapshot?.lcp  ?? null },
    { name: "CLS",  metric: snapshot?.cls  ?? null },
    { name: "INP",  metric: snapshot?.inp  ?? null },
    { name: "FCP",  metric: snapshot?.fcp  ?? null },
    { name: "TTFB", metric: snapshot?.ttfb ?? null },
  ];

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[--foreground]/60">
          Live Core Web Vitals
        </h3>
        <span className="flex items-center gap-1.5 text-xs text-[--foreground]/40">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[--good] animate-pulse" />
          Live
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-6">
        {metrics.map(({ name, metric }) => (
          <MetricBadge
            key={name}
            name={name}
            value={metric?.value ?? null}
            rating={metric?.rating}
            loading={snapshot === null}
          />
        ))}
      </div>

      {snapshot && !snapshot.lcp && (
        <p className="mt-4 text-xs text-[--foreground]/40">
          Metrics appear as you interact with the page. LCP fires on load;
          INP fires on first interaction; CLS accumulates over time.
        </p>
      )}
    </div>
  );
}
