import type { ProductDetail } from "@/lib/types";

/**
 * schema.org/Product — reflects only fields the API actually returned (real
 * prices, real rating), never fabricated, so a missing field just omits that
 * part of the object instead of guessing a value.
 *
 * Lives here rather than inside the page so it can be unit-tested directly
 * (Next.js validates page-file exports, so a page can't export a helper).
 */
export function productJsonLd(product: ProductDetail) {
  const cheapest = product.sellers[0];
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    image: product.imageUrl ?? undefined,
    brand: product.brand ? { "@type": "Brand", name: product.brand.name } : undefined,
    aggregateRating:
      product.rating != null && product.reviewCount != null
        ? {
            "@type": "AggregateRating",
            ratingValue: product.rating,
            reviewCount: product.reviewCount,
          }
        : undefined,
    // No `availability` field: the backend's stock-status signal is never
    // populated by the provider today (Price.availability is always written as
    // UNKNOWN at ingestion — SerpAPI carries no real stock status), so there is
    // no honest value to report. Omitting the field is correct; claiming
    // InStock unconditionally — which this used to do — is fabricating data.
    // Guarded by product-jsonld.test.ts; do not re-add it without a real signal.
    offers:
      product.sellers.length > 0
        ? {
            "@type": "AggregateOffer",
            // Real per-seller currency, never a hardcoded "INR".
            priceCurrency: cheapest.currency,
            lowPrice: cheapest.price,
            highPrice: product.sellers[product.sellers.length - 1].price,
            offerCount: product.sellers.length,
          }
        : undefined,
  };
}
