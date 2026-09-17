/**
 * Product Omni (ADR-0002): deterministic "why buy this" explanation, computed
 * from data the catalog already has — no model call, no fabricated claim.
 * Shared by `compare` (live SerpAPI-backed comparisons, used by the Flutter
 * app) and `products` (DB-only detail, used by apps/web) — same signal,
 * two data sources with slightly different shapes, hence the loose input type.
 */
export interface ProductOmniReason {
  tone: 'positive' | 'caution';
  text: string;
}

export interface ProductOmniTake {
  headline: string;
  reasons: ProductOmniReason[];
}

export interface OmniSellerInput {
  price: number;
  discountPct?: number | null;
}

export function computeProductOmni(sellers: OmniSellerInput[]): ProductOmniTake | null {
  const prices = sellers.map((s) => s.price).filter((p) => p > 0);
  if (prices.length === 0) return null;

  const lowest = Math.min(...prices);
  const highest = Math.max(...prices);
  const spreadPct = highest > 0 ? Math.round(((highest - lowest) / highest) * 100) : 0;
  const maxDiscount = Math.max(0, ...sellers.map((s) => s.discountPct ?? 0));

  const reasons: ProductOmniReason[] = [];
  if (spreadPct >= 10) {
    reasons.push({
      tone: 'positive',
      text: `${spreadPct}% cheaper than the highest listed price across stores.`,
    });
  }
  if (maxDiscount >= 15) {
    reasons.push({
      tone: 'positive',
      text: `Currently discounted ${maxDiscount}% off its listed price.`,
    });
  }
  if (sellers.length >= 3) {
    reasons.push({
      tone: 'positive',
      text: `Compared across ${sellers.length} stores for real price competition.`,
    });
  } else {
    reasons.push({
      tone: 'caution',
      text: `Only tracked at ${sellers.length} store${sellers.length === 1 ? '' : 's'} so far — limited price comparison.`,
    });
  }

  const headline =
    spreadPct >= 10 || maxDiscount >= 15 ? 'Good time to buy' : 'Fair price — nothing unusual';
  return { headline, reasons };
}
