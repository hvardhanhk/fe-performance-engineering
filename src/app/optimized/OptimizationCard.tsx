/**
 * OptimizationCard — Server Component.
 * No client JS needed — pure presentational.
 */

interface Props {
  icon: string;
  title: string;
  description: string;
  metric: string;
  variant: "good" | "bad";
}

export function OptimizationCard({ icon, title, description, metric, variant }: Props) {
  const borderClass = variant === "good" ? "border-[--good]/30" : "border-[--bad]/30";
  const labelClass = variant === "good" ? "text-[--good] bg-[--good]/10" : "text-[--bad] bg-[--bad]/10";
  const titleClass = variant === "good" ? "text-[--good]" : "text-[--bad]";

  return (
    <div className={`card ${borderClass}`}>
      <div className="flex items-start gap-2">
        <span className="text-lg shrink-0">{icon}</span>
        <div>
          <p className={`text-sm font-semibold ${titleClass}`}>{title}</p>
          <p className="text-xs text-[--foreground]/50 mt-0.5">{description}</p>
          <span className={`mt-1 inline-block text-xs px-1.5 py-0.5 rounded ${labelClass}`}>
            Improves: {metric}
          </span>
        </div>
      </div>
    </div>
  );
}
