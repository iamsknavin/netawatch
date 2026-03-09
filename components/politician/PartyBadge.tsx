import { cn } from "@/lib/utils";
import type { Party } from "@/types";

// Party color map — top parties get distinctive colors
const PARTY_COLORS: Record<string, string> = {
  BJP: "bg-orange-900/30 text-orange-400 border-orange-800/50",
  INC: "bg-blue-900/30 text-blue-400 border-blue-800/50",
  AAP: "bg-sky-900/30 text-sky-400 border-sky-800/50",
  AITC: "bg-teal-900/30 text-teal-400 border-teal-800/50",
  DMK: "bg-red-900/30 text-red-400 border-red-800/50",
  AIADMK: "bg-green-900/30 text-green-400 border-green-800/50",
  SP: "bg-red-900/30 text-red-300 border-red-800/50",
  BSP: "bg-blue-900/20 text-blue-300 border-blue-800/40",
  CPM: "bg-red-950/40 text-red-500 border-red-900/50",
  default: "bg-surface-2 text-text-secondary border-border",
};

interface PartyBadgeProps {
  party: Pick<Party, "abbreviation" | "name"> | null;
  className?: string;
}

export function PartyBadge({ party, className }: PartyBadgeProps) {
  const abbr = party?.abbreviation ?? "IND";
  const color = PARTY_COLORS[abbr] ?? PARTY_COLORS.default;

  return (
    <span
      className={cn(
        "inline-block font-mono text-2xs px-1.5 py-0.5 border rounded-sm whitespace-nowrap",
        color,
        className
      )}
      title={party?.name ?? "Independent"}
    >
      {abbr}
    </span>
  );
}
