/**
 * Pure math: compute (x, y) positions for parliament hemicycle seats.
 * No React — just geometry. Used server-side.
 */

import {
  getCoalition,
  getPartyColor,
  COALITION_META,
  type CoalitionName,
} from "./coalitions";

export interface Seat {
  x: number;
  y: number;
  color: string;
  party: string;
  coalition: CoalitionName;
}

export interface CoalitionStat {
  name: CoalitionName;
  label: string;
  seats: number;
  color: string;
}

export interface PartyInput {
  abbreviation: string;
  count: number;
}

/**
 * Lay out seats in a hemicycle (semicircle from left to right).
 * Returns seat positions in a 500×280 viewBox.
 *
 * Coalition ordering: INDIA on the left, OTHER in the center, NDA on the right.
 */
export function computeHemicycleLayout(parties: PartyInput[]): {
  seats: Seat[];
  coalitionStats: CoalitionStat[];
  totalSeats: number;
} {
  const totalSeats = parties.reduce((s, p) => s + p.count, 0);
  if (totalSeats === 0) return { seats: [], coalitionStats: [], totalSeats: 0 };

  // Group parties by coalition, sorted by count desc within each
  const grouped: Record<CoalitionName, PartyInput[]> = {
    INDIA: [],
    OTHER: [],
    NDA: [],
  };
  for (const p of parties) {
    grouped[getCoalition(p.abbreviation)].push(p);
  }
  for (const key of Object.keys(grouped) as CoalitionName[]) {
    grouped[key].sort((a, b) => b.count - a.count);
  }

  // Ordered seat list: INDIA (left) → OTHER (center) → NDA (right)
  const orderedSeats: { party: string; coalition: CoalitionName }[] = [];
  for (const coalition of ["INDIA", "OTHER", "NDA"] as CoalitionName[]) {
    for (const p of grouped[coalition]) {
      for (let i = 0; i < p.count; i++) {
        orderedSeats.push({
          party: p.abbreviation,
          coalition,
        });
      }
    }
  }

  // Hemicycle geometry
  const cx = 250; // center x
  const cy = 265; // center y (near bottom of viewBox)
  const NUM_ROWS = 7;
  const innerRadius = 90;
  const outerRadius = 240;
  const rowSpacing = (outerRadius - innerRadius) / (NUM_ROWS - 1);

  // Calculate seats per row proportional to arc length (circumference)
  const rowRadii: number[] = [];
  let totalArcLen = 0;
  for (let r = 0; r < NUM_ROWS; r++) {
    const radius = innerRadius + r * rowSpacing;
    rowRadii.push(radius);
    totalArcLen += radius;
  }

  const seatsPerRow: number[] = [];
  let assigned = 0;
  for (let r = 0; r < NUM_ROWS; r++) {
    const proportion = rowRadii[r] / totalArcLen;
    const count =
      r === NUM_ROWS - 1
        ? totalSeats - assigned
        : Math.round(proportion * totalSeats);
    seatsPerRow.push(count);
    assigned += count;
  }

  // Place seats along arcs (π → 0, i.e. left to right)
  const seats: Seat[] = [];
  let seatIdx = 0;

  for (let r = 0; r < NUM_ROWS; r++) {
    const radius = rowRadii[r];
    const n = seatsPerRow[r];
    if (n === 0) continue;

    // Pad angles slightly inward from the edges
    const padAngle = 0.04;
    const startAngle = Math.PI - padAngle;
    const endAngle = padAngle;
    const angleStep = n > 1 ? (startAngle - endAngle) / (n - 1) : 0;

    for (let i = 0; i < n; i++) {
      if (seatIdx >= orderedSeats.length) break;
      const angle = n > 1 ? startAngle - i * angleStep : Math.PI / 2;
      const x = cx + radius * Math.cos(angle);
      const y = cy - radius * Math.sin(angle);
      const { party, coalition } = orderedSeats[seatIdx];

      seats.push({
        x,
        y,
        color: getPartyColor(party),
        party,
        coalition,
      });
      seatIdx++;
    }
  }

  // Coalition stats
  const coalitionCounts: Record<CoalitionName, number> = {
    NDA: 0,
    INDIA: 0,
    OTHER: 0,
  };
  for (const s of orderedSeats) {
    coalitionCounts[s.coalition]++;
  }

  const coalitionStats: CoalitionStat[] = (
    ["NDA", "INDIA", "OTHER"] as CoalitionName[]
  ).map((name) => ({
    name,
    label: COALITION_META[name].label,
    seats: coalitionCounts[name],
    color: COALITION_META[name].color,
  }));

  return { seats, coalitionStats, totalSeats };
}
