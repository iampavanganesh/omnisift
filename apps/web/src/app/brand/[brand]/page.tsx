import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Section } from "@/components/section";
import { ProductCard } from "@/components/product-card";
import { EmptyState } from "@/components/empty-state";
import { BudgetChips } from "@/components/hub-extras";
import { BrandMark } from "@/components/brand-mark";
import { apiClient } from "@/lib/api-client";
import { formatInr } from "@/lib/format";
import { accentHue } from "@/lib/accent-color";
import type { BrandDetail } from "@/lib/types";

// Reads `searchParams` (sort/pageSize below) — Next.js opts any route that
// reads searchParams into dynamic (per-request) rendering regardless of a
// `revalidate` export, so ISR isn't actually available here without dropping
// the URL-driven sort/pagination pattern. Left force-dynamic deliberately
// (see P1 report) rather than adding a no-op revalidate export.
export const dynamic = "force-dynamic";

/** Real sort options the backend actually supports (catalog-detail.schemas.ts
 * `sort` enum, shared with /categories/:slug) — never show a sort control the
 * API can't honor. */
const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "discount_desc", label: "Biggest Discount" },
] as const;
type SortValue = (typeof SORT_OPTIONS)[number]["value"];

const DEFAULT_PAGE_SIZE = 20;
const LOAD_MORE_STEP = 20;
const MAX_PAGE_SIZE = 50; // backend's real ceiling — never pretend beyond it

async function getBrand(
  slug: string,
  params: { sort: SortValue; pageSize: number },
): Promise<BrandDetail | null> {
  try {
    const qs = new URLSearchParams();
    if (params.sort !== "newest") qs.set("sort", params.sort);
    qs.set("pageSize", String(params.pageSize));
    return await apiClient.get<BrandDetail>(`/brands/${slug}?${qs.toString()}`);
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ brand: string }>;
}): Promise<Metadata> {
  const { brand: brandSlug } = await params;
  const detail = await getBrand(brandSlug, { sort: "newest", pageSize: DEFAULT_PAGE_SIZE });
  if (!detail) return {};
  const name = detail.brand.name;
  return {
    title: `${name} — Products, Prices & Deals`,
    description: `Explore ${name} on OmniSift: products, prices, and deals across stores.`,
  };
}

export default async function BrandPage({
  params,
  searchParams,
}: {
  params: Promise<{ brand: string }>;
  searchParams: Promise<{ sort?: string; pageSize?: string }>;
}) {
  const { brand: brandSlug } = await params;
  const { sort: sortParam, pageSize: pageSizeParam } = await searchParams;
  const sort: SortValue = SORT_OPTIONS.some((o) => o.value === sortParam)
    ? (sortParam as SortValue)
    : "newest";
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(DEFAULT_PAGE_SIZE, Number(pageSizeParam) || DEFAULT_PAGE_SIZE),
  );

  const detail = await getBrand(brandSlug, { sort, pageSize });
  if (!detail) notFound();

  const { brand, insights, categoriesForBrand, sellersForBrand, products, hasMore } = detail;
  const hue = accentHue(brand.name);

  const sortHref = (value: SortValue) => {
    const qs = new URLSearchParams();
    if (value !== "newest") qs.set("sort", value);
    const s = qs.toString();
    return `/brand/${brandSlug}${s ? `?${s}` : ""}`;
  };
  const loadMoreHref = (() => {
    const qs = new URLSearchParams();
    if (sort !== "newest") qs.set("sort", sort);
    qs.set("pageSize", String(Math.min(MAX_PAGE_SIZE, pageSize + LOAD_MORE_STEP)));
    return `/brand/${brandSlug}?${qs.toString()}`;
  })();
  const atMaxPageSize = pageSize >= MAX_PAGE_SIZE;

  return (
    <div className="hub-page">
      <header
        className="hub-hero hub-hero-accent"
        style={{ "--hero-hue": hue } as React.CSSProperties}
      >
        <div className="hub-hero-brand-mark">
          <BrandMark name={brand.name} logoUrl={brand.logoUrl} size={72} />
        </div>
        <p className="eyebrow">Brand</p>
        <h1>{brand.name}</h1>
        <p className="hub-subtitle">
          {insights.productCount} product{insights.productCount === 1 ? "" : "s"}
          {insights.avgLowestPrice != null && ` · avg. ${formatInr(insights.avgLowestPrice)}`}
          {insights.topDiscountPct != null && ` · up to ${insights.topDiscountPct}% off`}
        </p>
        <form action="/search" className="hub-search">
          <input type="hidden" name="brand" value={brand.slug} />
          <input type="search" name="q" placeholder={`Search ${brand.name}...`} />
          <button type="submit">Search</button>
        </form>
      </header>

      {categoriesForBrand.length > 0 && (
        <Section title="Shop by category">
          <div className="chip-row">
            {categoriesForBrand.map((category) => (
              <Link
                key={category.slug}
                href={`/brand/${brand.slug}/${category.slug}`}
                className="chip"
              >
                {category.name} ({category.productCount})
              </Link>
            ))}
          </div>
        </Section>
      )}

      <Section title="Products">
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
                  Show more {brand.name}
                </Link>
              </p>
            )}
            {hasMore && atMaxPageSize && (
              <p className="hub-more-hint">
                More {brand.name} products at{" "}
                <Link href={`/search?q=${encodeURIComponent(brand.name)}`}>full search →</Link>
              </p>
            )}
          </>
        ) : (
          <EmptyState message="No products from this brand yet." />
        )}
      </Section>

      {sellersForBrand.length > 0 && (
        <Section title="Available at">
          <div className="chip-row">
            {sellersForBrand.map((seller) => (
              <span key={seller.id} className="chip chip-static">
                {seller.name} ({seller.productCount})
              </span>
            ))}
          </div>
        </Section>
      )}

      <BudgetChips searchHref={`/search?q=${encodeURIComponent(brand.name)}`} />
    </div>
  );
}
