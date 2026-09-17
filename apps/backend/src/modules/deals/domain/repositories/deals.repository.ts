export interface DealRow {
  productId: string;
  productSlug: string;
  title: string;
  imageUrl: string | null;
  platform: string;
  price: number;
  mrp: number | null;
  discountPct: number;
  productUrl: string;
  currency: string;
}

/** Read-only "biggest current discounts" feed, sourced from live catalog prices. */
export abstract class DealsRepository {
  abstract topDeals(limit: number): Promise<DealRow[]>;
}
