export function formatInr(amount: number): string {
  return `₹${Math.round(amount).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}
