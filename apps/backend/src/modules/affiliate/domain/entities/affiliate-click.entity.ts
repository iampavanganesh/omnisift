export class AffiliateClick {
  constructor(
    public readonly id: string,
    public readonly productId: string,
    public readonly productTitle: string,
    public readonly productImageUrl: string | null,
    public readonly sellerName: string,
    public readonly targetUrl: string,
    public readonly clickedAt: Date,
  ) {}
}
