/**
 * Query-parameter descriptions for `catalogDetailSchema`, shared by
 * GET /categories/:slug and GET /brands/:slug (both validate with that same
 * schema). Kept beside the schema so the two routes can't drift apart.
 *
 * Only describes what the schema actually accepts — the schema itself supplies
 * types, bounds, enums and defaults.
 */
export const CATALOG_DETAIL_QUERY_DOCS: Record<string, string> = {
  sort: 'Ordering for the product grid.',
  page: 'Zero-based page index.',
  pageSize: 'Rows per page.',
  category:
    'Cross-filter: scope a brand page to one category. Only meaningful on GET /brands/:slug.',
  brand:
    'Cross-filter: scope a category page to one brand. Only meaningful on GET /categories/:slug.',
  minPrice: 'Inclusive lower price bound.',
  maxPrice: 'Upper price bound (exclusive of 0; must be > 0).',
  brands:
    'Multi-select brand facet as a comma-separated list of brand SLUGS, e.g. "apple,samsung". Sent as a single string; the server splits it. Only meaningful on GET /categories/:slug — a brand page is already scoped to one brand.',
  minRating: 'Minimum product rating, 0–5.',
  specs:
    'Spec facets as "key1:val1|val2,key2:val3". Percent-encode each key and value. OR within a key, AND across keys. Valid keys/values come from GET /categories/:slug/facets.',
};
