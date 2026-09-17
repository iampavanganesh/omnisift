import type { Metadata } from "next";
import { Suspense } from "react";
import { Section } from "@/components/section";
import { ProductCard } from "@/components/product-card";
import { EmptyState } from "@/components/empty-state";
import { SkeletonProductGrid } from "@/components/skeleton";
import { apiClient } from "@/lib/api-client";
import type { DealProduct } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Best Deals",
  description:
    "The biggest discounts off list price right now, across the stores OmniSift tracks.",
};

// 50 is the backend's real ceiling for this endpoint (deals.schemas.ts) — ask
// for the full amount rather than an arbitrary smaller number.
async function getDeals(): Promise<DealProduct[]> {
  try {
    return await apiClient.get<DealProduct[]>("/deals?limit=50");
  } catch {
    return [];
  }
}

async function CurrentDeals() {
  const deals = await getDeals();
  if (deals.length === 0) {
    return <EmptyState message="No live deals right now." />;
  }
  return (
    <div className="product-grid">
      {deals.map((deal) => (
        <ProductCard
          key={deal.productId}
          href={`/product/${deal.productSlug}`}
          title={deal.title}
          imageUrl={deal.imageUrl}
          price={deal.price}
          isGoodPrice
          meta={`${deal.discountPct}% off at ${deal.platform}`}
          // DealProduct.imageUrl can fall back to a raw, never-rehosted
          // per-listing thumbnail (prisma-deals.repository.ts) — not
          // guaranteed to be on next.config.ts's allow-listed domains.
          unoptimizedImage
        />
      ))}
    </div>
  );
}

export default function DealsPage() {
  return (
    <div className="index-page">
      <h1>Best Deals</h1>
      {/* Honest framing: /deals ranks by the seller's own advertised discount off
          list price (prisma-deals.repository.ts orders by discountPct, which comes
          from the store's "N% off" string or MRP-vs-price). OmniSift does not yet
          validate these against a typical/historical price, so this copy must not
          claim that it does. */}
      <p className="hub-subtitle">
        The biggest discounts off list price right now, across the stores OmniSift tracks.
        Open a product to compare it across every store before you buy.
      </p>

      <Section title="Current deals">
        <Suspense fallback={<SkeletonProductGrid count={12} />}>
          <CurrentDeals />
        </Suspense>
      </Section>
    </div>
  );
}
