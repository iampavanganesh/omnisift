import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Section } from "@/components/section";
import { ProductCard } from "@/components/product-card";
import { EmptyState } from "@/components/empty-state";
import { BudgetChips } from "@/components/hub-extras";
import { BrandLogoGrid } from "@/components/brand-logo-grid";
import { SpecFacetChips } from "@/components/spec-facet-chips";
import { apiClient } from "@/lib/api-client";
import { formatInr } from "@/lib/format";
import { accentHue } from "@/lib/accent-color";
import { getCategoryTagline } from "@/lib/category-presentation";
import { encodeSpecs, parseSpecs } from "@/lib/specs";
import type { CategoryDetail, CategoryFacet, MostSearchedProduct } from "@/lib/types";

// Reads `searchParams` (specs/sort/pageSize below) — Next.js opts any route
// that reads searchParams into dynamic (per-request) rendering regardless of
// a `revalidate` export, so ISR isn't actually available here without
// dropping the URL-driven filter/sort/pagination pattern. Left force-dynamic
// deliberately (see P1 report) rather than adding a no-op revalidate export.
export const dynamic = "force-dynamic";

/** Real sort options the backend actually supports (catalog-detail.schemas.ts
 * `sort` enum) — never show a sort control the API can't honor. */
const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "discount_desc", label: "Biggest Discount" },
] as const;
type SortValue = (typeof SORT_OPTIONS)[number]["value"];

const DEFAULT_PAGE_SIZE = 20;
const LOAD_MORE_STEP = 20;
const MAX_PAGE_SIZE = 50; // backend's real ceiling (catalog-detail.schemas.ts) — never pretend beyond it

async function getCategory(
  slug: string,
  params: { specs: string; sort: SortValue; pageSize: number },
): Promise<CategoryDetail | null> {
  try {
    const qs = new URLSearchParams();
    if (params.specs) qs.set("specs", params.specs);
    if (params.sort !== "newest") qs.set("sort", params.sort);
    qs.set("pageSize", String(params.pageSize));
    const query = qs.toString();
    return await apiClient.get<CategoryDetail>(`/categories/${slug}${query ? `?${query}` : ""}`);
  } catch {
    return null;
  }
}

/** Same detail endpoint, sorted by real discount — powers "Best Deals" below.
 * Discount-only proxy for now, explicitly not a multi-factor deal score (no
 * seller-quality or per-product popularity signal exists yet to back one). */
async function getBestDeals(slug: string, specs: string): Promise<CategoryDetail | null> {
  try {
    const specsParam = specs ? `&specs=${encodeURIComponent(specs)}` : "";
    return await apiClient.get<CategoryDetail>(
      `/categories/${slug}?sort=discount_desc&pageSize=8${specsParam}`,
    );
  } catch {
    return null;
  }
}

async function getMostSearchedInCategory(slug: string): Promise<MostSearchedProduct[]> {
  try {
    return await apiClient.get<MostSearchedProduct[]>(
      `/discovery/most-searched/${slug}?limit=4`,
    );
  } catch {
    return [];
  }
}

/** Real, data-driven filter facets — empty until the category has enough
 * real products to filter on. Never a hardcoded per-category taxonomy. */
async function getFacets(slug: string): Promise<CategoryFacet[]> {
  try {
    return await apiClient.get<CategoryFacet[]>(`/categories/${slug}/facets`);
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
  const detail = await getCategory(slug, { specs: "", sort: "newest", pageSize: DEFAULT_PAGE_SIZE });
  if (!detail) return {};
  const name = detail.category.name;
  return {
    title: `${name} — Compare Prices & Find the Best Deals`,
    description: `Explore ${name} on OmniSift: real prices across brands, compared side by side.`,
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ specs?: string; sort?: string; pageSize?: string }>;
}) {
  const { slug } = await params;
  const { specs: specsParam, sort: sortParam, pageSize: pageSizeParam } = await searchParams;
  const currentSpecs = parseSpecs(specsParam);
  const specsStr = encodeSpecs(currentSpecs);
  const sort: SortValue = SORT_OPTIONS.some((o) => o.value === sortParam)
    ? (sortParam as SortValue)
    : "newest";
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(DEFAULT_PAGE_SIZE, Number(pageSizeParam) || DEFAULT_PAGE_SIZE),
  );

  const detail = await getCategory(slug, { specs: specsStr, sort, pageSize });
  if (!detail) notFound();

  const { category, insights, brandsInCategory, topDeal, products, hasMore } = detail;
  const [bestDeals, mostSearched, facets] = await Promise.all([
    getBestDeals(slug, specsStr),
    getMostSearchedInCategory(slug),
    getFacets(slug),
  ]);
  const bestDealProducts = (bestDeals?.products ?? []).filter(
    (p) => p.discountPct != null && p.discountPct > 0,
  );
  const hue = accentHue(category.name);

  // Base for links that should preserve the current filter/sort but change
  // one dimension (pageSize for "load more", sort for the sort row).
  const baseParams = new URLSearchParams();
  if (specsStr) baseParams.set("specs", specsStr);
  const sortHref = (value: SortValue) => {
    const qs = new URLSearchParams(baseParams);
    if (value !== "newest") qs.set("sort", value);
    const s = qs.toString();
    return `/category/${slug}${s ? `?${s}` : ""}`;
  };
  const loadMoreHref = (() => {
    const qs = new URLSearchParams(baseParams);
    if (sort !== "newest") qs.set("sort", sort);
    qs.set("pageSize", String(Math.min(MAX_PAGE_SIZE, pageSize + LOAD_MORE_STEP)));
    return `/category/${slug}?${qs.toString()}`;
  })();
  const atMaxPageSize = pageSize >= MAX_PAGE_SIZE;

  return (
    <div className="hub-page">
      <header
        className="hub-hero hub-hero-accent"
        style={{ "--hero-hue": hue } as React.CSSProperties}
      >
        <p className="eyebrow">Category</p>
        <h1>{category.name}</h1>
        <p className="hub-tagline">{getCategoryTagline(category.slug)}</p>
        <p className="hub-subtitle">
          {insights.productCount} product{insights.productCount === 1 ? "" : "s"}
          {insights.avgLowestPrice != null && ` · avg. ${formatInr(insights.avgLowestPrice)}`}
          {insights.topDiscountPct != null && ` · up to ${insights.topDiscountPct}% off`}
        </p>
        <form action="/search" className="hub-search">
          <input type="hidden" name="category" value={category.slug} />
          <input type="search" name="q" placeholder={`Search ${category.name.toLowerCase()}...`} />
          <button type="submit">Search</button>
        </form>
      </header>

      {brandsInCategory.length > 0 && (
        <Section title={`Explore ${category.name} Brands`}>
          <BrandLogoGrid brands={brandsInCategory} categorySlug={category.slug} />
        </Section>
      )}

      {facets.length > 0 && (
        <Section title="Refine by">
          <SpecFacetChips
            facets={facets}
            currentSpecs={currentSpecs}
            baseHref={`/category/${slug}`}
          />
        </Section>
      )}

      {(mostSearched.length > 0 || topDeal) && (
        <Section title={`${category.name} Intelligence`}>
          <div className="intelligence-row">
            {mostSearched.length > 0 && (
              <div className="intelligence-card">
                <p className="intelligence-card-label">Most searched in {category.name}</p>
                <ProductCard
                  title={mostSearched[0].title}
                  imageUrl={mostSearched[0].imageUrl}
                  price={mostSearched[0].price}
                  meta={`${mostSearched[0].searchCount} search${mostSearched[0].searchCount === 1 ? "" : "es"} today`}
                />
              </div>
            )}
            {topDeal && (
              <div className="intelligence-card">
                {/* `topDeal` is the row with the highest discountPct (seller's
                    advertised discount off list price) — not an observed drop
                    from a price OmniSift recorded earlier. Label says discount. */}
                <p className="intelligence-card-label">Biggest discount</p>
                <ProductCard
                  href={`/product/${topDeal.slug}`}
                  title={topDeal.title}
                  imageUrl={topDeal.imageUrl}
                  price={topDeal.lowestPrice}
                  isGoodPrice
                  meta={topDeal.discountPct != null ? `↓ ${topDeal.discountPct}%` : undefined}
                />
              </div>
            )}
          </div>
        </Section>
      )}

      {bestDealProducts.length > 0 && (
        <Section title={`Best ${category.name} Deals`}>
          <div className="product-grid">
            {bestDealProducts.map((product) => (
              <ProductCard
                key={product.id}
                href={`/product/${product.slug}`}
                title={product.title}
                imageUrl={product.imageUrl}
                price={product.lowestPrice}
                isGoodPrice
                meta={`↓ ${product.discountPct}% · ${product.sellerCount} seller${product.sellerCount === 1 ? "" : "s"}`}
              />
            ))}
          </div>
        </Section>
      )}

      <Section title={`All ${category.name} Products`}>
        {products.length > 0 ? (
          <>
            <div className="sort-row" role="group" aria-label="Sort products">
              {SORT_OPTIONS.map((option) => (
                <Link
                  key={option.value}
                  href={sortHref(option.value)}
                  className={sort === option.value ? "chip chip-active" : "chip"}
                >
                  {option.label}
                </Link>
              ))}
            </div>
            <div className="product-grid">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  href={`/product/${product.slug}`}
                  title={product.title}
                  imageUrl={product.imageUrl}
                  price={product.lowestPrice}
                  isGoodPrice={product.discountPct != null && product.discountPct >= 15}
                  meta={`${product.sellerCount} seller${product.sellerCount === 1 ? "" : "s"}`}
                />
              ))}
            </div>
            {hasMore && !atMaxPageSize && (
              <p className="hub-more-hint">
                <Link href={loadMoreHref} className="button-secondary button-small">
                  Show more {category.name.toLowerCase()}
                </Link>
              </p>
            )}
            {hasMore && atMaxPageSize && (
              <p className="hub-more-hint">
                More {category.name.toLowerCase()} at{" "}
                <Link href={`/search?q=${encodeURIComponent(category.name)}`}>full search →</Link>
              </p>
            )}
          </>
        ) : (
          <EmptyState
            message={
              specsStr
                ? "No products match your filters."
                : "No products in this category yet."
            }
          />
        )}
      </Section>

      <BudgetChips searchHref={`/search?q=${encodeURIComponent(category.name)}`} />
    </div>
  );
}
