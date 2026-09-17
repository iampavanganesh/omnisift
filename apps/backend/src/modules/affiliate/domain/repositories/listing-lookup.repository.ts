/** Resolves a (product, seller) pair to the real seller URL for redirects. */
export abstract class ListingLookupRepository {
  /** Null if no listing exists for this product/seller pair. */
  abstract findUrl(productId: string, sellerId: string): Promise<string | null>;
  /** Same lookup, keyed by the seller's display name/platform (e.g. "Amazon")
   * instead of its internal UUID — for callers (Flutter's compare screens)
   * that only ever see the provider-shaped `platform` string, never a real
   * sellerId. Slugifies internally, same as affiliate-click recording. Null
   * if the platform doesn't resolve to a known seller, or no listing exists. */
  abstract findUrlByPlatform(productId: string, platform: string): Promise<string | null>;
}
