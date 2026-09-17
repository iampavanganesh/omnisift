import { describe, expect, it } from "vitest";
import { productJsonLd } from "./product-jsonld";
import type { ProductDetail, ProductSeller } from "./types";

/**
 * Structured-data truthfulness guard (production-hardening pass, P0.5).
 *
 * This page used to emit `availability: "https://schema.org/InStock"` on every
 * product unconditionally, and a hardcoded `priceCurrency: "INR"`. Neither was
 * backed by real data: the backend never receives a stock-status signal from
 * the provider (Price.availability is always UNKNOWN at ingestion). Publishing
 * a fabricated availability claim in machine-readable markup that search
 * engines and shopping surfaces consume is exactly the kind of thing this
 * project must not do — these tests exist so it can't come back quietly.
 */
function seller(overrides: Partial<ProductSeller> = {}): ProductSeller {
  return {
    sellerId: "s1",
    sellerName: "Amazon",
    price: 100,
    mrp: null,
    discountPct: null,
    currency: "INR",
    ...overrides,
  };
}

function product(overrides: Partial<ProductDetail> = {}): ProductDetail {
  return {
    id: "p1",
    slug: "test-product",
    title: "Test Product",
    brand: null,
    category: null,
    imageUrl: null,
    images: [],
    specs: null,
    lowestPrice: 100,
    sellers: [seller()],
    omni: null,
    rating: null,
    reviewCount: null,
    ratingBreakdown: [],
    reviews: [],
    ...overrides,
  };
}

describe("productJsonLd", () => {
  it("never emits an availability claim — there is no real stock signal to back one", () => {
    const jsonLd = productJsonLd(product({ sellers: [seller(), seller({ price: 150 })] }));

    expect(jsonLd.offers).toBeDefined();
    expect(jsonLd.offers).not.toHaveProperty("availability");
    // Belt and braces: the fabricated value must not appear anywhere in the
    // serialized markup, under any key.
    expect(JSON.stringify(jsonLd)).not.toContain("InStock");
    expect(JSON.stringify(jsonLd)).not.toContain("schema.org/In");
  });

  it("takes priceCurrency from the real seller row, not a hardcoded INR", () => {
    const jsonLd = productJsonLd(
      product({ sellers: [seller({ currency: "USD", price: 10 }), seller({ currency: "USD", price: 20 })] }),
    );

    expect(jsonLd.offers).toMatchObject({ priceCurrency: "USD" });
  });

  it("reports the real price range and offer count from the seller list", () => {
    const jsonLd = productJsonLd(
      product({
        sellers: [seller({ price: 100 }), seller({ price: 150 }), seller({ price: 220 })],
      }),
    );

    expect(jsonLd.offers).toMatchObject({
      "@type": "AggregateOffer",
      lowPrice: 100,
      highPrice: 220,
      offerCount: 3,
    });
  });

  it("omits offers entirely when there are no sellers rather than inventing a price", () => {
    const jsonLd = productJsonLd(product({ sellers: [] }));
    expect(jsonLd.offers).toBeUndefined();
  });

  it("omits aggregateRating when rating/reviewCount are unknown", () => {
    expect(productJsonLd(product()).aggregateRating).toBeUndefined();
    expect(productJsonLd(product({ rating: 4.5, reviewCount: null })).aggregateRating).toBeUndefined();
    expect(productJsonLd(product({ rating: null, reviewCount: 10 })).aggregateRating).toBeUndefined();
  });

  it("includes aggregateRating only when both values are real", () => {
    const jsonLd = productJsonLd(product({ rating: 4.7, reviewCount: 11 }));
    expect(jsonLd.aggregateRating).toMatchObject({
      "@type": "AggregateRating",
      ratingValue: 4.7,
      reviewCount: 11,
    });
  });
});
