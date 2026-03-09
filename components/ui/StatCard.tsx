import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  accent?: boolean;
  danger?: boolean;
  className?: string;
}

export function StatCard({
  label,
  value,
  subValue,
  accent,
  danger,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "bg-surface border border-border p-4 rounded-sm",
        className
      )}
    >
      <p className="text-text-secondary text-2xs uppercase tracking-widest font-mono mb-1">
        {label}
      </p>
      <p
        className={cn(
          "font-mono text-xl font-semibold",
          accent && "text-accent",
          danger && "text-danger",
          !accent && !danger && "text-text-primary"
        )}
      >
        {value}
      </p>
      {subValue && (
        <p className="text-text-muted text-2xs mt-1 font-mono">{subValue}</p>
      )}
    </div>
  );
}
