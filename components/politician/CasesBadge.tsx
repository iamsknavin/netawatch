import { cn } from "@/lib/utils";

interface CasesBadgeProps {
  count: number;
  hasHeinous?: boolean;
  className?: string;
}

export function CasesBadge({ count, hasHeinous, className }: CasesBadgeProps) {
  if (count === 0) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 font-mono text-2xs px-2 py-0.5 rounded-sm border",
          "bg-safe/10 text-safe border-safe/30",
          className
        )}
      >
        ✓ 0 cases
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-mono text-2xs px-2 py-0.5 rounded-sm border",
        hasHeinous
          ? "bg-danger/20 text-danger border-danger/50 font-semibold"
          : "bg-danger/10 text-danger border-danger/30",
        className
      )}
      title={hasHeinous ? "Includes heinous offences (murder, rape, kidnapping, major fraud)" : undefined}
    >
      {hasHeinous && "⚠ "}
      {count} case{count !== 1 ? "s" : ""}
    </span>
  );
}
