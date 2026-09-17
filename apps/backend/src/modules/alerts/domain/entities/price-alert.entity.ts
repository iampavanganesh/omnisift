// C:\omnisift_final\apps\backend\src\modules\alerts\domain\entities\price-alert.entity.ts
export type AlertType = 'ANY_DROP' | 'BELOW_TARGET';

/** A user's price-drop watch on a product (internal Product UUID). */
export class PriceAlert {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly productId: string,
    public readonly type: AlertType,
    public readonly targetPrice: number | null, // required only for BELOW_TARGET
    public readonly isActive: boolean,
    public readonly lastTriggeredAt: Date | null,
    public readonly lastNotifiedPrice: number | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    // joined product display fields (null when not included)
    public readonly productTitle: string | null = null,
    public readonly productImageUrl: string | null = null,
  ) {}
}
