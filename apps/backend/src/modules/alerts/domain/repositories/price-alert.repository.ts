// C:\omnisift_final\apps\backend\src\modules\alerts\domain\repositories\price-alert.repository.ts
import { AlertType, PriceAlert } from '../entities/price-alert.entity';

export interface CreatePriceAlertInput {
  productId: string;
  type: AlertType;
  targetPrice: number | null;
}

export abstract class PriceAlertRepository {
  /** Create or update this user's alert for [productId, type]. Re-setting reactivates it. */
  abstract upsert(userId: string, input: CreatePriceAlertInput): Promise<PriceAlert>;
  abstract list(userId: string): Promise<PriceAlert[]>;
  abstract delete(userId: string, id: string): Promise<void>;
  abstract setActive(userId: string, id: string, isActive: boolean): Promise<PriceAlert | null>;

  // --- checker (Stage 3) ---
  /** All active alerts watching this product (any user). */
  abstract findActiveByProduct(productId: string): Promise<PriceAlert[]>;
  /** Distinct productIds with at least one active alert (any user) — refresh candidates. */
  abstract findDistinctActiveProductIds(): Promise<string[]>;
  /** Record a fire: set lastNotifiedPrice + lastTriggeredAt. */
  abstract markTriggered(id: string, notifiedPrice: number, at: Date): Promise<void>;
  /** Arm an ANY_DROP alert's first-seen baseline price (no fire). */
  abstract setBaseline(id: string, price: number): Promise<void>;
}
