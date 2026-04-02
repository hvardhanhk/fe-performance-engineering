/**
 * MetricBadge — Server Component.
 * Displays a single CWV metric with its rating colour.
 */

import { formatMetricValue, getRatingColor } from "@/lib/vitals";
import type { MetricRating } from "@/types/vitals";

interface Props {
  name: string;
  value: number | null;
  rating?: MetricRating;
  /** Show a skeleton when value is null */
  loading?: boolean;
}

const RATING_LABELS: Record<MetricRating, string> = {
  good: "Good",
  "needs-improvement": "Needs work",
  poor: "Poor",
};

export function MetricBadge({ name, value, rating, loading }: Props) {
  if (loading || value === null) {
    return (
      <div className="flex flex-col gap-1">
        <span className="text-xs text-[--foreground]/50 uppercase tracking-wider">
          {name}
        </span>
        {/*
          Reserved dimensions prevent CLS — the skeleton takes the same
          space as the real value before it loads.
        */}
        <div className="skeleton h-8 w-24 rounded" />
        <div className="skeleton h-4 w-16 rounded" />
      </div>
    );
  }

  const displayRating = rating ?? "needs-improvement";
  const color = getRatingColor(displayRating);

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-[--foreground]/50 uppercase tracking-wider">
        {name}
      </span>
      <span
        className="text-2xl font-bold tabular-nums"
        style={{ color }}
      >
        {formatMetricValue(name, value)}
      </span>
      <span
        className="text-xs font-medium"
        style={{ color }}
      >
        {RATING_LABELS[displayRating]}
      </span>
    </div>
  );
}
