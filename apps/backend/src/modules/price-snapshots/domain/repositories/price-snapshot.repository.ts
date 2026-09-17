export interface PriceSnapshotRow {
  lowest: number;
  highest: number;
  average: number;
  capturedAt: Date;
}

export interface SellerGraphPoint {
  sellerId: string;
  sellerName: string;
  price: number;
  mrp: number | null;
  discountPct: number | null;
  capturedAt: Date;
}

export abstract class PriceSnapshotRepository {
  /** Records at most one snapshot per product per day. */
  abstract recordDaily(
    productId: string,
    lowest: number,
    highest: number,
    average: number,
  ): Promise<void>;
  /** Ordered oldest→newest history for a product. */
  abstract history(productId: string): Promise<PriceSnapshotRow[]>;
  /** Per-seller price points for a product since `sinceDays` ago (for the graph). */
  abstract sellerGraph(productId: string, sinceDays: number): Promise<SellerGraphPoint[]>;
}
