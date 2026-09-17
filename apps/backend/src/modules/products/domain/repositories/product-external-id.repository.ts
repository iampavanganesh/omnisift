// C:\omnisift_final\apps\backend\src\modules\products\domain\repositories\product-external-id.repository.ts
export abstract class ProductExternalIdRepository {
  /** Idempotently link an internal product to a provider's external id. */
  abstract link(productId: string, provider: string, externalId: string): Promise<void>;
  /** Resolve a provider external id → internal product id (or null). */
  abstract resolve(provider: string, externalId: string): Promise<string | null>;
  /** Batch resolve many external ids → internal ids (for the search path). */
  abstract resolveMany(provider: string, externalIds: string[]): Promise<Map<string, string>>;
}
