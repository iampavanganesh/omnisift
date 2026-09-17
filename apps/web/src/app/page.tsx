import { Suspense } from "react";
import Link from "next/link";
import { Section } from "@/components/section";
import { ProductCard } from "@/components/product-card";
import { EmptyState } from "@/components/empty-state";
import { SearchBar } from "@/components/search-bar";
import { SkeletonChipRow, SkeletonProductRail } from "@/components/skeleton";
import { apiClient } from "@/lib/api-client";
import { FALLBACK_CATEGORIES, isUserFacingCategory } from "@/lib/catalog-data";
import type { CatalogProduct, CategorySummary, MostSearchedProduct, DealProduct } from "@/lib/types";

export const dynamic = "force-dynamic";

async function getCategories(): Promise<CategorySummary[]> {
  try {
    const categories = await apiClient.get<CategorySummary[]>("/categories");
    return categories.filter(isUserFacingCategory);
  } catch {
    return FALLBACK_CATEGORIES;
  }
}

async function getMostSearched(): Promise<MostSearchedProduct[]> {
  try {
    return await apiClient.get<MostSearchedProduct[]>("/discovery/most-searched?limit=8");
  } catch {
    return [];
  }
}

async function getTrending(): Promise<CatalogProduct[]> {
  try {
    return await apiClient.get<CatalogProduct[]>("/discovery/trending?limit=8");
  } catch {
    return [];
  }
}

async function getDeals(): Promise<DealProduct[]> {
  try {
    return await apiClient.get<DealProduct[]>("/deals?limit=4");
  } catch {
    return [];
  }
}

/**
 * Each section below fetches and renders independently inside its own
 * <Suspense> boundary — Next streams each in as soon as ITS OWN call
 * resolves, instead of one Promise.all blocking every section behind the
 * slowest endpoint and the whole page behind a single global spinner
 * (app/loading.tsx still exists as the outermost fallback, but with this
 * shell resolving synchronously it rarely fires for the home route now).
 * Every fallback is shaped like the real content, not a generic spinner.
 */

// PopularCategoriesLine and CategoryChips both call getCategories() — this is
// NOT a duplicate network call: Next.js memoizes identical fetch(url, options)
// calls within one render pass, so the two independent Suspense boundaries
// still share a single real request to the backend.
async function PopularCategoriesLine() {
  const categories = await getCategories();
  if (categories.length === 0) return null;
  return (
    <p className="hero-popular">
      Popular:{" "}
      {categories.slice(0, 4).map((category, i) => (
        <span key={category.slug}>
          {i > 0 && " · "}
          <Link href={`/category/${category.slug}`}>{category.name}</Link>
        </span>
      ))}
    </p>
  );
}

async function CategoryChips() {
  const categories = await getCategories();
  if (categories.length === 0) {
    return <EmptyState message="Categories will appear here once the catalog has products." />;
  }
  return (
    <div className="chip-row">
      {categories.map((category) => (
        <Link key={category.slug} href={`/category/${category.slug}`} className="chip">
          {category.name} ({category.productCount})
        </Link>
      ))}
    </div>
  );
}

async function MostSearchedRail() {
  const mostSearched = await getMostSearched();
  if (mostSearched.length === 0) {
    return (
      <EmptyState message="What everyone's searching for on OmniSift will appear here once there's enough activity in the last 24 hours." />
    );
  }
  return (
    <div className="product-rail">
      {mostSearched.map((product) => (
        <div key={product.productId} className="product-rail-item">
          <ProductCard
            title={product.title}
            imageUrl={product.imageUrl}
            price={product.price}
            meta={`${product.searchCount} search${product.searchCount === 1 ? "" : "es"} today`}
          />
        </div>
      ))}
    </div>
  );
}

async function TrendingRail() {
  const trending = await getTrending();
  if (trending.length === 0) {
    return <EmptyState message="Trending products will appear here once the catalog has products." />;
  }
  return (
    <div className="product-rail">
      {trending.map((product) => (
        <div key={product.id} className="product-rail-item">
          <ProductCard
            href={`/product/${product.slug}`}
            title={product.title}
            imageUrl={product.imageUrl}
            price={product.lowestPrice}
            meta={`${product.sellerCount} seller${product.sellerCount === 1 ? "" : "s"}`}
          />
        </div>
      ))}
    </div>
  );
}

async function DealsRail() {
  const deals = await getDeals();
  if (deals.length === 0) {
    // Same honesty rule as /deals: this rail ranks by the seller's advertised
    // discount off list price, not against a typical/historical price.
    return (
      <EmptyState message="No discounted products to show yet — this section fills in as products get tracked across stores." />
    );
  }
  return (
    <div className="product-rail">
      {deals.map((deal) => (
        <div key={deal.productId} className="product-rail-item">
          <ProductCard
            href={`/product/${deal.productSlug}`}
            title={deal.title}
            imageUrl={deal.imageUrl}
            price={deal.price}
            isGoodPrice
            meta={`${deal.discountPct}% off at ${deal.platform}`}
          />
        </div>
      ))}
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="home-page">
      <section className="hero">
        <p className="eyebrow">Product Intelligence Platform</p>
        <h1>Buy with Confidence.</h1>
        <p className="hero-subtitle">
          Compare products, understand prices, and make smarter buying decisions.
        </p>
        <SearchBar formClassName="hero-search" />
        <Suspense fallback={null}>
          <PopularCategoriesLine />
        </Suspense>
      </section>

      <Section title="Shop by category" viewAllHref="/category">
        <Suspense fallback={<SkeletonChipRow />}>
          <CategoryChips />
        </Suspense>
      </Section>

      <Section title="Most Searched — Last 24 Hours">
        <Suspense fallback={<SkeletonProductRail />}>
          <MostSearchedRail />
        </Suspense>
      </Section>

      <Section title="Trending right now" viewAllHref="/trending">
        <Suspense fallback={<SkeletonProductRail />}>
          <TrendingRail />
        </Suspense>
      </Section>

      <Section title="Best deals" viewAllHref="/deals">
        <Suspense fallback={<SkeletonProductRail count={4} />}>
          <DealsRail />
        </Suspense>
      </Section>
    </div>
  );
}
