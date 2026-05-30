/** Normalize goal/raised values — some docs store millions (e.g. 8.5 for $8.5M). */
export function normalizeCampaignDollars(value: number | undefined, fallback: number): number {
  if (value == null || value <= 0) return fallback;
  if (value < 100_000) return Math.round(value * 1_000_000);
  return value;
}

export function formatCampaignDollars(amount: number): string {
  return `$${Math.round(amount).toLocaleString("en-US")}`;
}
