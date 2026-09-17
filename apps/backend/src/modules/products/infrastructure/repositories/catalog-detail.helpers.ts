import { CatalogProductRow, CatalogSort } from '../../domain/repositories/catalog-detail.types';

/**
 * A syntactically-valid UUID that can never match a real row. Used as a
 * cross-filter sentinel (e.g. an unresolved ?category=/?brand= slug) so the
 * query naturally yields zero rows instead of a Postgres UUID-cast error —
 * `categoryId`/`brandId` are `@db.Uuid` columns, so a plain string like
 * '__no_match__' fails at the database driver, not gracefully in JS.
 */
export const NO_MATCH_ID = '00000000-0000-0000-0000-000000000000';

type ListingWithPrice = {
  price: { currentPrice: unknown; discountPct: number | null; availability: string } | null;
};
type ProductWithListings = {
  id: string;
  slug: string;
  title: string;
  primaryImageUrl: string | null;
  listings: ListingWithPrice[];
};

/**
 * One product row — price/discount computed from listings not known to be out
 * of stock. SerpAPI's search/immersive responses never actually carry a real
 * stock-status signal (see catalog.prisma.repository.ts — `availability` is
 * always written as UNKNOWN at ingestion), so requiring IN_STOCK would exclude
 * every row that exists today. UNKNOWN is treated as available; only an
 * explicit OUT_OF_STOCK (once/if that signal is ever added) excludes a listing.
 */
export function toProductRow(p: ProductWithListings): CatalogProductRow {
  const inStock = p.listings
    .map((l) => l.price)
    .filter(
      (price): price is NonNullable<typeof price> =>
        price != null && price.availability !== 'OUT_OF_STOCK',
    );

  const prices = inStock.map((pr) => Number(pr.currentPrice));
  const lowestPrice = prices.length ? Math.min(...prices) : null;

  const discounts = inStock.map((pr) => pr.discountPct).filter((d): d is number => d != null);
  const discountPct = discounts.length ? Math.max(...discounts) : null;

  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    imageUrl: p.primaryImageUrl,
    lowestPrice,
    discountPct,
    sellerCount: p.listings.length,
  };
}

/** Filters already-computed rows by the SAME derived `lowestPrice` that sort and
 *  the product card both use — filtering against "any seller in range" would let
 *  a ₹50,000 product appear in a ₹10,000 filter just because one obscure seller
 *  listing happens to be cheap, which is inconsistent with what's shown. A row
 *  with no priced listing is excluded once a price filter is active. */
export function applyPriceFilter(
  rows: CatalogProductRow[],
  minPrice?: number,
  maxPrice?: number,
): CatalogProductRow[] {
  if (minPrice == null && maxPrice == null) return rows;
  return rows.filter((r) => {
    if (r.lowestPrice == null) return false;
    if (minPrice != null && r.lowestPrice < minPrice) return false;
    if (maxPrice != null && r.lowestPrice > maxPrice) return false;
    return true;
  });
}

/** Some scraped spec values are really a comma-separated list packed into one
 *  string (e.g. a "Colour" cell reading "Blue, Silver, Mint" because the source
 *  page listed every available colour in one field) rather than one real
 *  attribute. Splitting on comma turns each into its own real, selectable
 *  value — still exactly what was scraped, just tokenized instead of treated
 *  as one giant compound "value" nobody could ever usefully filter by. */
export function splitSpecValue(raw: string): string[] {
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/** This product's own spec entries whose value is a single real token —
 *  never a packed "many options" list (splitSpecValue length > 1). A packed
 *  value means the seller's page just enumerated everything available, not
 *  which one this specific listing/price is — not a safe anchor for
 *  cross-listing matching. A single value means the scrape captured one
 *  specific SKU, e.g. "Colour: Blue" — a real, trustworthy fact about this
 *  exact listing. */
export function ownSingleValuedSpecs(
  specs: Record<string, string> | null,
): { key: string; value: string }[] {
  if (!specs) return [];
  const result: { key: string; value: string }[] = [];
  for (const [key, raw] of Object.entries(specs)) {
    if (!raw) continue;
    const tokens = splitSpecValue(raw);
    if (tokens.length === 1) result.push({ key, value: tokens[0] });
  }
  return result;
}

/** Strips this product's OWN single-valued spec tokens out of its title, then
 *  normalizes to bare lowercase alphanumerics. Two separately-scraped
 *  listings land on the same signature only if their titles are identical
 *  once each one's own real, distinct attribute values are removed — e.g.
 *  "Nothing Phone (3a) 8GB 256GB Blue" and a same-model "...512GB Black" row
 *  both reduce to "nothingphone3a8gb". Purely data-driven: never a hardcoded
 *  colour/key list, just whatever this product's own specs actually say. */
export function variantBaseSignature(
  title: string,
  ownValues: { key: string; value: string }[],
): string {
  let working = title.toLowerCase();
  for (const { value } of ownValues) {
    const v = value.toLowerCase().trim();
    if (!v) continue;
    working = working.split(v).join(' ');
    const collapsed = v.replace(/\s+/g, '');
    if (collapsed !== v) working = working.split(collapsed).join(' ');
  }
  return working.replace(/[^a-z0-9]/g, '');
}

/** Filters RAW product rows (before toProductRow, since CatalogProductRow
 *  doesn't carry specs) by real spec facets — AND across different keys, OR
 *  within one key's selected values. A product missing a requested key never
 *  matches it. Matches if the requested value is one of the (comma-split)
 *  tokens in the product's raw spec value — same tokenization getFacets uses
 *  to build the option list, so a chip always actually matches what earned it. */
export function applySpecsFilter<T extends { specs: unknown }>(
  products: T[],
  specs?: Record<string, string[]>,
): T[] {
  if (!specs || Object.keys(specs).length === 0) return products;
  return products.filter((p) => {
    const productSpecs = (p.specs as Record<string, string> | null) ?? {};
    return Object.entries(specs).every(([key, values]) => {
      const raw = productSpecs[key];
      if (!raw) return false;
      const tokens = splitSpecValue(raw);
      return values.some((v) => tokens.includes(v));
    });
  });
}

/** Sorts + paginates already-computed rows (price/discount can't be a plain SQL
 *  ORDER BY here since they're aggregated across each product's listings). Fine
 *  at the catalog's current scale — see plan notes on this being reconsidered
 *  if a category/brand ever grows into the thousands of products. */
export function sortAndPage(
  rows: CatalogProductRow[],
  sort: CatalogSort,
  page: number,
  pageSize: number,
): { paged: CatalogProductRow[]; hasMore: boolean } {
  const sorted = [...rows];
  switch (sort) {
    case 'price_asc':
      sorted.sort((a, b) => (a.lowestPrice ?? Infinity) - (b.lowestPrice ?? Infinity));
      break;
    case 'price_desc':
      sorted.sort((a, b) => (b.lowestPrice ?? -Infinity) - (a.lowestPrice ?? -Infinity));
      break;
    case 'discount_desc':
      sorted.sort((a, b) => (b.discountPct ?? -1) - (a.discountPct ?? -1));
      break;
    case 'newest':
      break; // already newest-first from the query's orderBy
  }
  const start = page * pageSize;
  return {
    paged: sorted.slice(start, start + pageSize),
    hasMore: start + pageSize < sorted.length,
  };
}

export function computeInsights(rows: CatalogProductRow[]): {
  productCount: number;
  avgLowestPrice: number | null;
  topDiscountPct: number | null;
} {
  const priced = rows.filter((r) => r.lowestPrice != null);
  const avgLowestPrice = priced.length
    ? priced.reduce((sum, r) => sum + r.lowestPrice!, 0) / priced.length
    : null;
  const topDiscountPct = rows.reduce<number | null>(
    (max, r) => (r.discountPct != null && r.discountPct > (max ?? -1) ? r.discountPct : max),
    null,
  );
  return { productCount: rows.length, avgLowestPrice, topDiscountPct };
}
