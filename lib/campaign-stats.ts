/** Normalize goal/raised values — some docs store millions (e.g. 8.5 for $8.5M).
 *  Values < 1000 are treated as "millions format" (8.5 → $8,500,000).
 *  Values >= 1000 are treated as already in dollars (51000 → $51,000). */
export function normalizeCampaignDollars(value: number | undefined, fallback: number): number {
  if (value == null || value <= 0) return fallback;
  if (value < 1000) return Math.round(value * 1_000_000);
  return value;
}

export function formatCampaignDollars(amount: number): string {
  return `$${Math.round(amount).toLocaleString("en-US")}`;
}
