/** A saved product snapshot (V1 stores product data directly, not an FK). */
export class WishlistItem {
  constructor(
    public readonly id: string,
    public readonly productId: string,
    public readonly token: string,
    public readonly title: string,
    public readonly imageUrl: string,
    public readonly price: number,
    public readonly platform: string,
    public readonly productUrl: string,
    public readonly createdAt: Date,
  ) {}
}
