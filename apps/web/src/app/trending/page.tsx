import type { Metadata } from "next";
import { Suspense } from "react";
import { Section } from "@/components/section";
import { ProductCard } from "@/components/product-card";
import { EmptyState } from "@/components/empty-state";
import { SkeletonProductGrid } from "@/components/skeleton";
import { apiClient } from "@/lib/api-client";
import type { CatalogProduct } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Trending",
  description: "What's gaining attention on OmniSift right now.",
};

// 50 is the backend's real ceiling for this endpoint (trending.schemas.ts) —
// ask for the full amount rather than an arbitrary smaller number.
async function getTrending(): Promise<CatalogProduct[]> {
  try {
    return await apiClient.get<CatalogProduct[]>("/discovery/trending?limit=50");
  } catch {
    return [];
  }
}

async function TrendingProducts() {
  const trending = await getTrending();
  if (trending.length === 0) {
    return <EmptyState message="Nothing trending yet." />;
  }
  return (
    <div className="product-grid">
      {trending.map((product) => (
        <ProductCard
          key={product.id}
          href={`/product/${product.slug}`}
          title={product.title}
          imageUrl={product.imageUrl}
          price={product.lowestPrice}
          meta={`${product.sellerCount} seller${product.sellerCount === 1 ? "" : "s"}`}
        />
      ))}
    </div>
  );
}

export default function TrendingPage() {
  return (
    <div className="index-page">
      <h1>Trending</h1>
      <p className="hub-subtitle">Newest additions to the catalog.</p>

      <Section title="Trending products">
        <Suspense fallback={<SkeletonProductGrid count={12} />}>
          <TrendingProducts />
        </Suspense>
      </Section>
    </div>
  );
}
