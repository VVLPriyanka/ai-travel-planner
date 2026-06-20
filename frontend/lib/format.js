/**
 * Formats a number as US Dollars with standard thousands grouping
 * (e.g. $123,456). Falls back gracefully for non-finite input so a
 * bad/missing value never crashes a render.
 */
export function formatUSD(amount, { withSymbol = true } = {}) {
  const value = Number.isFinite(amount) ? amount : 0;
  const formatted = value.toLocaleString('en-US', { maximumFractionDigits: 0 });
  return withSymbol ? `$${formatted}` : formatted;
}
