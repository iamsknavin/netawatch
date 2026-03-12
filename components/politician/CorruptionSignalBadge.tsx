import { PHASE_CONFIG } from "@/lib/config";
import { cn } from "@/lib/utils";
import type { CorruptionSignal } from "@/types";

interface CorruptionSignalBadgeProps {
  signals?: CorruptionSignal[];
  className?: string;
}

const SEVERITY_STYLES: Record<string, string> = {
  critical: "bg-danger/20 text-danger border-danger/50",
  high: "bg-warning/20 text-warning border-warning/50",
  medium: "bg-accent/10 text-accent border-accent/30",
  low: "bg-surface-2 text-text-secondary border-border",
};

export function CorruptionSignalBadge({
  signals,
  className,
}: CorruptionSignalBadgeProps) {
  // Only render when corruption signals feature is enabled
  if (!PHASE_CONFIG.features.corruption_signals) {
    return null;
  }

  if (!signals || signals.length === 0) {
    return null;
  }

  // Show the highest severity signal
  const topSignal = signals.reduce((prev, curr) => {
    const order = ["critical", "high", "medium", "low"];
    const prevIdx = order.indexOf(prev.signal_severity ?? "low");
    const currIdx = order.indexOf(curr.signal_severity ?? "low");
    return currIdx < prevIdx ? curr : prev;
  });

  const style =
    SEVERITY_STYLES[topSignal.signal_severity ?? "low"] ??
    SEVERITY_STYLES.low;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-mono text-2xs px-2 py-0.5 rounded-sm border",
        style,
        className
      )}
      title={topSignal.signal_description ?? undefined}
    >
      ⚡ {signals.length} signal{signals.length !== 1 ? "s" : ""}
    </span>
  );
}
