/**
 * Indian parliamentary coalition definitions and party color mappings.
 * Based on the 18th Lok Sabha (2024 elections).
 */

export type CoalitionName = "NDA" | "INDIA" | "OTHER";

/** NDA (National Democratic Alliance) — ruling coalition */
const NDA_PARTIES = [
  "BJP", "JDU", "TDP", "SS", "SHS", "JDS", "AGP", "RLD",
  "LJPRV", "ADMP", "AJSUP", "HAMS", "JSP", "NDPP", "NPF",
  "NPP", "RLP", "SKM", "UPPL", "RLTP", "PMK",
];

/** INDIA (Indian National Developmental Inclusive Alliance) — opposition */
const INDIA_PARTIES = [
  "INC", "SP", "AITC", "DMK", "NCP", "RJD", "AAP", "CPI",
  "CPM", "CPIM", "IUML", "VCK", "RSP", "MDMK", "JMM",
  "KC(M)", "KCM",
];

const NDA_SET = new Set(NDA_PARTIES);
const INDIA_SET = new Set(INDIA_PARTIES);

export function getCoalition(abbreviation: string): CoalitionName {
  if (NDA_SET.has(abbreviation)) return "NDA";
  if (INDIA_SET.has(abbreviation)) return "INDIA";
  return "OTHER";
}

export const COALITION_META: Record<
  CoalitionName,
  { label: string; color: string }
> = {
  NDA: { label: "NDA", color: "#e8c547" },
  INDIA: { label: "I.N.D.I.A", color: "#4a9eed" },
  OTHER: { label: "Others", color: "#555566" },
};

/** Hex colors for SVG fills — keyed by party abbreviation */
export const PARTY_COLORS: Record<string, string> = {
  BJP: "#FF6B2B",
  INC: "#19AAED",
  SP: "#d32f2f",
  AITC: "#20B2AA",
  DMK: "#E53E3E",
  TDP: "#FFD700",
  JDU: "#2E8B57",
  NCP: "#00796B",
  SS: "#FF8C00",
  SHS: "#FF8C00",
  CPI: "#C62828",
  CPM: "#C62828",
  CPIM: "#C62828",
  RJD: "#2E7D32",
  YSRCP: "#0066CC",
  AAP: "#0EA5E9",
  IUML: "#388E3C",
  RLD: "#43A047",
  VCK: "#6A1B9A",
  JDS: "#2E8B57",
  AGP: "#F9A825",
  RSP: "#D84315",
  MDMK: "#B71C1C",
  AIMIM: "#1B5E20",
  JMM: "#006400",
  BSP: "#4169E1",
  IND: "#6B7280",
};

const DEFAULT_COLOR = "#6B7280";

export function getPartyColor(abbreviation: string): string {
  return PARTY_COLORS[abbreviation] ?? DEFAULT_COLOR;
}
