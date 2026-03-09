import { formatIndianCurrency } from "@/lib/formatters";

interface WealthBarProps {
  totalAssets: number | null;
  totalLiabilities: number | null;
}

export function WealthBar({ totalAssets, totalLiabilities }: WealthBarProps) {
  const assets = totalAssets ?? 0;
  const liabilities = totalLiabilities ?? 0;
  const total = assets + liabilities;
  const assetPct = total > 0 ? (assets / total) * 100 : 100;
  const liabilityPct = total > 0 ? (liabilities / total) * 100 : 0;

  return (
    <div className="space-y-2">
      {/* Bar */}
      <div className="h-3 bg-surface-2 rounded-sm overflow-hidden flex">
        <div
          className="h-full bg-accent transition-all"
          style={{ width: `${assetPct}%` }}
          title={`Assets: ${formatIndianCurrency(assets)}`}
        />
        {liabilities > 0 && (
          <div
            className="h-full bg-danger/70"
            style={{ width: `${liabilityPct}%` }}
            title={`Liabilities: ${formatIndianCurrency(liabilities)}`}
          />
        )}
      </div>

      {/* Legend */}
      <div className="flex justify-between text-2xs font-mono text-text-secondary">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 bg-accent rounded-sm" />
          Assets {formatIndianCurrency(assets)}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 bg-danger/70 rounded-sm" />
          Liabilities {formatIndianCurrency(liabilities)}
        </span>
      </div>
    </div>
  );
}
