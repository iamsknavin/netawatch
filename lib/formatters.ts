/**
 * Indian number system formatter.
 * Uses lakhs (1,00,000) and crores (1,00,00,000) — NOT millions/billions.
 * All monetary displays in the app must use these functions.
 */

export function formatIndianCurrency(
  amount: number | null | undefined,
  compact = true
): string {
  if (amount === null || amount === undefined || isNaN(amount)) return "₹0";
  if (amount === 0) return "₹0";

  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";

  if (compact) {
    if (abs >= 1_00_00_00_000) {
      // 1000 crore+
      return `${sign}₹${(abs / 1_00_00_00_000).toFixed(2)} Lakh Cr`;
    }
    if (abs >= 1_00_00_000) {
      // 1 crore+
      return `${sign}₹${(abs / 1_00_00_000).toFixed(2)} Cr`;
    }
    if (abs >= 1_00_000) {
      // 1 lakh+
      return `${sign}₹${(abs / 1_00_000).toFixed(2)} L`;
    }
    if (abs >= 1_000) {
      return `${sign}₹${(abs / 1_000).toFixed(1)}K`;
    }
    return `${sign}₹${abs.toLocaleString("en-IN")}`;
  }

  // Full format with Indian grouping
  return `${sign}₹${abs.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
}

export function formatIndianNumber(n: number | null | undefined): string {
  if (n === null || n === undefined || isNaN(n)) return "0";
  return n.toLocaleString("en-IN");
}

/** Format a percentage to 1 decimal place */
export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return "N/A";
  return `${value.toFixed(1)}%`;
}

/** Format a date to Indian style: DD MMM YYYY */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "N/A";
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

/** Relative time: "3 days ago", "2 hours ago" */
export function formatRelativeTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "N/A";
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60_000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    if (minutes > 0) return `${minutes} min ago`;
    return "just now";
  } catch {
    return dateStr;
  }
}
