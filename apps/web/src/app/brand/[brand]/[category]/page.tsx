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
 * `sort` enum, shared with /categories/:slug and /brands/:slug) — never show
 * a sort control the API can't honor. */
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

// Reuses GET /brands/:slug?category=:category (see ARCHITECTURE.md: brand×category
// is a cross-filter on the existing endpoints, not a separate backend concept).
async function getBrandInCategory(
  brandSlug: string,
  categorySlug: string,
  params: { sort: SortValue; pageSize: number },
): Promise<BrandDetail | null> {
  try {
    const qs = new URLSearchParams();
    qs.set("category", categorySlug);
    if (params.sort !== "newest") qs.set("sort", params.sort);
    qs.set("pageSize", String(params.pageSize));
    return await apiClient.get<BrandDetail>(`/brands/${brandSlug}?${qs.toString()}`);
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ brand: string; category: string }>;
}): Promise<Metadata> {
  const { brand: brandSlug, category: categorySlug } = await params;
  const detail = await getBrandInCategory(brandSlug, categorySlug, {
    sort: "newest",
    pageSize: DEFAULT_PAGE_SIZE,
  });
  if (!detail) return {};
  const categoryName = detail.categoriesForBrand.find((c) => c.slug === categorySlug)?.name ?? categorySlug;
  const title = `${detail.brand.name} ${categoryName}`;
  return {
    title: `${title} — Compare Prices`,
    description: `${title} compared across stores — prices and deals on OmniSift.`,
  };
}

export default async function BrandCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ brand: string; category: string }>;
  searchParams: Promise<{ sort?: string; pageSize?: string }>;
}) {
  const { brand: brandSlug, category: categorySlug } = await params;
  const { sort: sortParam, pageSize: pageSizeParam } = await searchParams;
  const sort: SortValue = SORT_OPTIONS.some((o) => o.value === sortParam)
    ? (sortParam as SortValue)
    : "newest";
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(DEFAULT_PAGE_SIZE, Number(pageSizeParam) || DEFAULT_PAGE_SIZE),
  );

  const detail = await getBrandInCategory(brandSlug, categorySlug, { sort, pageSize });
  if (!detail) notFound();

  const { brand, insights, products, hasMore } = detail;
  // The category name isn't in this response's top level (it's a brand-detail
  // response, filtered) — read it off the one cross-reference entry that matches.
  const categoryName =
    detail.categoriesForBrand.find((c) => c.slug === categorySlug)?.name ?? categorySlug;
  const hue = accentHue(brand.name);

  const sortHref = (value: SortValue) => {
    const qs = new URLSearchParams();
    if (value !== "newest") qs.set("sort", value);
    const s = qs.toString();
    return `/brand/${brandSlug}/${categorySlug}${s ? `?${s}` : ""}`;
  };
  const loadMoreHref = (() => {
    const qs = new URLSearchParams();
    if (sort !== "newest") qs.set("sort", sort);
    qs.set("pageSize", String(Math.min(MAX_PAGE_SIZE, pageSize + LOAD_MORE_STEP)));
    return `/brand/${brandSlug}/${categorySlug}?${qs.toString()}`;
  })();
  const atMaxPageSize = pageSize >= MAX_PAGE_SIZE;
  const comboName = `${brand.name} ${categoryName}`;

  return (
    <div className="hub-page">
      <header
        className="hub-hero hub-hero-accent"
        style={{ "--hero-hue": hue } as React.CSSProperties}
      >
        <div className="hub-hero-brand-mark">
          <BrandMark name={brand.name} logoUrl={brand.logoUrl} size={72} />
        </div>
        <p className="eyebrow">
          {brand.name} · {categoryName}
        </p>
        <h1>{comboName}</h1>
        <p className="hub-subtitle">
          {insights.productCount} product{insights.productCount === 1 ? "" : "s"}
          {insights.avgLowestPrice != null && ` · avg. ${formatInr(insights.avgLowestPrice)}`}
        </p>
      </header>

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
                  Show more {comboName}
                </Link>
              </p>
            )}
            {hasMore && atMaxPageSize && (
              <p className="hub-more-hint">
                More {comboName} at{" "}
                <Link href={`/search?q=${encodeURIComponent(comboName)}`}>full search →</Link>
              </p>
            )}
          </>
        ) : (
          <EmptyState message={`No ${brand.name} products in ${categoryName} yet.`} />
        )}
      </Section>

      <p>
        <Link href={`/brand/${brand.slug}`}>← All {brand.name} products</Link>
      </p>

      <BudgetChips searchHref={`/search?q=${encodeURIComponent(comboName)}`} />
    </div>
  );
}
