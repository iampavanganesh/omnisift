import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Section } from "@/components/section";
import { EmptyState } from "@/components/empty-state";
import { ProductCard } from "@/components/product-card";
import { PriceHistoryChart } from "@/components/price-history-chart";
import { apiClient } from "@/lib/api-client";
import { env } from "@/lib/env";
import { formatInr } from "@/lib/format";
import { productJsonLd } from "@/lib/product-jsonld";
import { getRuntimeConfig } from "@/lib/runtime-config";
import type { CatalogProduct, PricePoint, ProductDetail, VariantSibling } from "@/lib/types";

export const dynamic = "force-dynamic";

async function getProduct(slug: string): Promise<ProductDetail | null> {
  try {
    return await apiClient.get<ProductDetail>(`/products/slug/${slug}`);
  } catch {
    return null;
  }
}

async function getSimilar(productId: string): Promise<CatalogProduct[]> {
  try {
    return await apiClient.get<CatalogProduct[]>(`/products/${productId}/similar?limit=8`);
  } catch {
    return [];
  }
}

/** Real other listings of the same base model (different colour/storage,
 * each its own real price) — empty when none exist, which is common today. */
async function getVariantSiblings(productId: string): Promise<VariantSibling[]> {
  try {
    return await apiClient.get<VariantSibling[]>(`/products/${productId}/variant-siblings`);
  } catch {
    return [];
  }
}

/** Only ever called once the runtime flag confirms the feature is on — see
 * ProductPage below. Never fetched (let alone shown) while priceGraphEnabled
 * is false, so the UI can't imply live price history that isn't live. */
async function getPriceHistory(productId: string): Promise<PricePoint[]> {
  try {
    return await apiClient.get<PricePoint[]>(`/products/history?productId=${productId}`);
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return {};
  const description = `${product.title} — compare prices across stores before you buy.`;
  return {
    title: product.title,
    description,
    openGraph: product.imageUrl
      ? { title: product.title, description, images: [product.imageUrl] }
      : { title: product.title, description },
    twitter: product.imageUrl
      ? { card: "summary_large_image", title: product.title, description, images: [product.imageUrl] }
      : { card: "summary_large_image", title: product.title, description },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const [similar, variantSiblings, config] = await Promise.all([
    getSimilar(product.id),
    getVariantSiblings(product.id),
    getRuntimeConfig(),
  ]);
  const otherVariants = variantSiblings.filter((v) => !v.isCurrent);
  // Sellers arrive sorted ascending by price (prisma-product-query.repository.ts),
  // so [0] is always genuinely the cheapest — safe to badge without recomputing.
  const cheapestSeller = product.sellers[0] ?? null;
  // Never fetch price history while the flag is off — the feature isn't live
  // yet (not enough cross-seller data platform-wide), so the UI must not even
  // ask for it, let alone imply it exists.
  const priceHistory = config?.priceGraphEnabled ? await getPriceHistory(product.id) : [];

  return (
    <article className="product-page">
      {/* JSON-LD is inert data, not executable script (CSP script-src doesn't gate it); `<` is
          escaped below so a scraped title containing "</script>" can't break out. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productJsonLd(product)).replace(/</g, "\\u003c"),
        }}
      />
      <header className="product-hero">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt=""
            width={560}
            height={560}
            sizes="(max-width: 768px) 100vw, 280px"
            className="product-hero-image"
            priority
          />
        ) : (
          <div className="product-hero-image" aria-hidden />
        )}
        <div>
          <p className="eyebrow">{product.brand?.name ?? "Product"}</p>
          <h1>{product.title}</h1>
          {product.rating != null && (
            <p className="product-rating-line">
              ★ {product.rating.toFixed(1)}
              {product.reviewCount != null && ` (${product.reviewCount.toLocaleString("en-IN")} reviews)`}
            </p>
          )}
          <p className="product-price">
            {product.lowestPrice != null ? formatInr(product.lowestPrice) : "Price unavailable"}
            {cheapestSeller?.mrp != null && cheapestSeller.mrp > cheapestSeller.price && (
              <span className="product-price-mrp">{formatInr(cheapestSeller.mrp)}</span>
            )}
            {cheapestSeller?.discountPct != null && cheapestSeller.discountPct > 0 && (
              <span className="badge-good">{cheapestSeller.discountPct}% off</span>
            )}
          </p>
          {product.sellers.length > 0 && (
            <p className="product-seller-count">
              Compared across {product.sellers.length} store{product.sellers.length === 1 ? "" : "s"}
            </p>
          )}
          <div className="product-actions">
            <a href={`${env.appUrl}/compare?product=${product.id}`} className="button-secondary">
              Compare
            </a>
            <a href={`${env.appUrl}/wishlist?add=${product.id}`} className="button-secondary">
              Add to wishlist
            </a>
          </div>
        </div>
      </header>

      {product.omni && (
        <Section title="Omni's Take">
          <div className="omni-card">
            <p className="omni-headline">{product.omni.headline}</p>
            <ul>
              {product.omni.reasons.map((reason, i) => (
                <li
                  key={i}
                  className={reason.tone === "positive" ? "omni-positive" : "omni-caution"}
                >
                  {reason.text}
                </li>
              ))}
            </ul>
          </div>
        </Section>
      )}

      <Section title="Where to buy">
        {product.sellers.length > 0 ? (
          <div className="seller-table-wrap">
            <table className="seller-table">
              <tbody>
                {product.sellers.map((seller, i) => (
                  <tr key={seller.sellerId} className={i === 0 ? "seller-row-best" : undefined}>
                    <td>
                      <span className="seller-name">{seller.sellerName}</span>
                      {i === 0 && <span className="badge-good seller-best-badge">Best price</span>}
                    </td>
                    <td className="seller-price-cell">
                      <span className="seller-price">{formatInr(seller.price)}</span>
                      {seller.mrp != null && seller.mrp > seller.price && (
                        <span className="seller-mrp">{formatInr(seller.mrp)}</span>
                      )}
                      {seller.discountPct != null && seller.discountPct > 0 && (
                        <span className="badge-good">{seller.discountPct}% off</span>
                      )}
                    </td>
                    <td>
                      {/* Never link a raw seller URL — always through the backend's
                          affiliate redirect so OmniSift can't become an open redirect. */}
                      <Link
                        href={`${env.publicApiUrl}/affiliate/go/product/${product.id}/seller/${seller.sellerId}`}
                      >
                        Visit →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState message="Seller listings and price comparison populate once this product is matched across providers." />
        )}
      </Section>

      <Section title="Price history">
        {priceHistory.length > 0 ? (
          <PriceHistoryChart points={priceHistory} />
        ) : (
          <EmptyState message="Not enough price history has been recorded for this product yet." />
        )}
      </Section>

      {otherVariants.length > 0 && (
        <Section title="Also Available As">
          <div className="product-grid">
            {otherVariants.map((v) => (
              <ProductCard
                key={v.id}
                href={`/product/${v.slug}`}
                title={v.title}
                imageUrl={v.imageUrl}
                price={v.lowestPrice}
                meta={v.label}
              />
            ))}
          </div>
        </Section>
      )}

      <Section title="Specifications">
        {product.specs && Object.keys(product.specs).length > 0 ? (
          <table className="spec-table">
            <tbody>
              {Object.entries(product.specs).map(([key, value]) => (
                <tr key={key}>
                  <td className="spec-key">{key}</td>
                  <td>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState message="No specifications recorded for this product yet." />
        )}
      </Section>

      <Section title="Reviews">
        {product.reviews.length > 0 ? (
          <div className="reviews-block">
            {product.ratingBreakdown.length > 0 && (
              <div className="rating-breakdown">
                {[...product.ratingBreakdown]
                  .sort((a, b) => b.stars - a.stars)
                  .map((bar) => {
                    const total = product.ratingBreakdown.reduce((sum, b) => sum + b.amount, 0);
                    const pct = total > 0 ? Math.round((bar.amount / total) * 100) : 0;
                    return (
                      <div key={bar.stars} className="rating-bar-row">
                        <span className="rating-bar-label">{bar.stars}★</span>
                        <div className="rating-bar-track">
                          <div className="rating-bar-fill" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="rating-bar-count">{bar.amount}</span>
                      </div>
                    );
                  })}
              </div>
            )}
            <div className="review-list">
              {product.reviews.map((review, i) => (
                <div key={i} className="review-card">
                  <div className="review-card-head">
                    <span className="review-author">{review.userName || "Anonymous"}</span>
                    {review.rating != null && <span className="review-stars">★ {review.rating}</span>}
                  </div>
                  {review.title && <p className="review-title">{review.title}</p>}
                  <p className="review-text">{review.text}</p>
                  <p className="review-meta">
                    {review.source}
                    {review.date && ` · ${review.date}`}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <EmptyState message="No reviews recorded for this product yet." />
        )}
      </Section>

      <Section title="Similar products">
        {similar.length > 0 ? (
          <div className="product-grid">
            {similar.map((p) => (
              <ProductCard
                key={p.id}
                href={`/product/${p.slug}`}
                title={p.title}
                imageUrl={p.imageUrl}
                price={p.lowestPrice}
                isGoodPrice={p.discountPct != null && p.discountPct >= 15}
                meta={`${p.sellerCount} seller${p.sellerCount === 1 ? "" : "s"}`}
              />
            ))}
          </div>
        ) : (
          <EmptyState message="No similar products found yet." />
        )}
      </Section>
    </article>
  );
}
