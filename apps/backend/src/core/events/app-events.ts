import { Availability } from '@prisma/client';
/** Internal event names. Emitters/listeners are decoupled (no queue infra in V1). */
export const AppEvents = {
  ProductUpdated: 'product.updated',
  PriceObserved: 'price.observed',
  AlertTriggered: 'alert.triggered',
  PriceSnapshotRecorded: 'price.snapshot.recorded',
  ProductPriceObserved: 'product.price.observed', // ← NEW: feeds price alerts
} as const;

export type AppEventName = (typeof AppEvents)[keyof typeof AppEvents];

/** A single observed price point appended to the canonical price_history log. */
export interface PriceObservation {
  listingId: string;
  providerId: string;
  price: number;
  mrp?: number | null;
  currency?: string;
  availability?: Availability;
  discountPct?: number | null; // 0–100 at this observation
  sellerId?: string | null; // direct seller link for analytics
}

/** Payload emitted on `price.observed` by the Product Acquisition Service. */
export interface PriceObservedPayload {
  productId: string;
  observedAt: Date;
  observations: PriceObservation[];
}

/** Payload for PriceSnapshotRecorded (denormalized SerpAPI price point). */
export interface PriceSnapshotEventPayload {
  productId: string;
  lowest: number;
  highest: number;
  average: number;
}

/** NEW: emitted whenever a fresh price is seen for a product (search or compare).
 *  Consumed by the price-alerts checker. Carries whichever id the source has:
 *  compare has the internal UUID; search has only the provider (Google) id. */
export interface ProductPriceObservedPayload {
  internalProductId?: string; // present from compare
  externalId?: string; // provider product id (Google id) — search & compare
  provider?: string; // 'serpapi' for search-origin observations
  price: number;
  source: 'search' | 'compare';
}
