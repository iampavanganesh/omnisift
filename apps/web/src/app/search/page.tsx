import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { EmptyState } from "@/components/empty-state";
import { SearchBar } from "@/components/search-bar";
import { BudgetChips } from "@/components/hub-extras";
import { SkeletonProductGrid } from "@/components/skeleton";
import { apiClient } from "@/lib/api-client";
import type { SearchProduct, MostSearchedProduct } from "@/lib/types";

export const dynamic = "force-dynamic";

// Query pages aren't canonical destinations — category/brand hubs are (see
// robots.ts, which also disallows crawling /search to avoid wasting crawl budget
// on infinite query strings). This meta tag is defense in depth for bots that
// ignore robots.txt but still respect noindex.
export const metadata: Metadata = {
  title: "Search",
  description: "Search products across stores and compare prices on OmniSift.",
  robots: { index: false, follow: true },
};

/** Distinguishes "the backend genuinely has nothing" from "the backend call
 * failed" — these are different real situations and must say different
 * things (see Phase 5 real-data audit: an outage must never look like "no
 * results"). Null means the call itself failed. */
async function search(query: string, maxPrice?: string): Promise<SearchProduct[] | null> {
  try {
    const params = new URLSearchParams({ q: query });
    if (maxPrice) params.set("maxPrice", maxPrice);
    return await apiClient.get<SearchProduct[]>(`/search?${params.toString()}`);
  } catch {
    return null;
  }
}

async function getTrendingSearches(): Promise<MostSearchedProduct[]> {
  try {
    return await apiClient.get<MostSearchedProduct[]>("/discovery/most-searched?limit=6");
  } catch {
    return [];
  }
}

async function TrendingSearches() {
  const trending = await getTrendingSearches();
  if (trending.length === 0) {
    return <EmptyState message="Type a product, brand, or category to search." />;
  }
  return (
    <>
      <p className="search-prompt">Type a product, brand, or category to search — or try what&apos;s trending:</p>
      <div className="chip-row">
        {trending.map((product) => (
          <Link
            key={product.productId}
            href={`/search?q=${encodeURIComponent(product.title)}`}
            className="chip"
            title={product.title}
          >
            {product.title}
          </Link>
        ))}
      </div>
    </>
  );
}

async function SearchResults({ q, maxPrice }: { q: string; maxPrice?: string }) {
  const results = await search(q, maxPrice);

  if (results === null) {
    return (
      <EmptyState message="Search is temporarily unavailable — this is a connection issue on our end, not a sign there are no results. Please try again in a moment." />
    );
  }

  if (results.length === 0) {
    return (
      <EmptyState message="No results found. Try a shorter or more general term, check the spelling, or browse by category instead." />
    );
  }

  return (
    <>
      <p className="hub-subtitle search-intelligence-note">
        These are live results from OmniSift&apos;s shopping intelligence system — not yet in our
        catalog. Open one on its store to buy; a permanent product page (with price history and
        comparisons) appears here once it&apos;s been compared at least once.
      </p>
      <BudgetChips searchHref={`/search?q=${encodeURIComponent(q)}`} />
      <div className="product-grid">
        {results.map((product) => (
          <ProductCard
            key={product.productId}
            title={product.title}
            imageUrl={product.imageUrl}
            price={product.price}
            isGoodPrice={product.oldPrice != null && product.price < product.oldPrice}
            meta={`${product.platform}${product.rating ? ` · ★ ${product.rating.toFixed(1)}` : ""}`}
          />
        ))}
      </div>
    </>
  );
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; maxPrice?: string }>;
}) {
  const { q = "", maxPrice } = await searchParams;

  return (
    <div className="search-page">
      <SearchBar formClassName="hub-search" defaultValue={q} />

      {q ? (
        <>
          <h1>Results for &ldquo;{q}&rdquo;</h1>
          <Suspense fallback={<SkeletonProductGrid />}>
            <SearchResults q={q} maxPrice={maxPrice} />
          </Suspense>
        </>
      ) : (
        <Suspense fallback={null}>
          <TrendingSearches />
        </Suspense>
      )}
    </div>
  );
}
