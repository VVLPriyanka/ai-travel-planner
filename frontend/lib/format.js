/**
 * Formats a number as Indian Rupees using Indian digit grouping
 * (e.g. 1,23,456 instead of 123,456). Falls back gracefully for
 * non-finite input so a bad/missing value never crashes a render.
 */
export function formatINR(amount, { withSymbol = true } = {}) {
  const value = Number.isFinite(amount) ? amount : 0;
  const formatted = value.toLocaleString('en-IN', { maximumFractionDigits: 0 });
  return withSymbol ? `₹${formatted}` : formatted;
}
