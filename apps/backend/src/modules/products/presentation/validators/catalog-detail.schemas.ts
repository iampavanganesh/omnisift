import { z } from 'zod';

export const catalogDetailSchema = z.object({
  sort: z.enum(['price_asc', 'price_desc', 'discount_desc', 'newest']).optional().default('newest'),
  page: z.coerce.number().int().min(0).optional().default(0),
  pageSize: z.coerce.number().int().min(1).max(50).optional().default(20),
  // Cross-filters powering /brand/{brand}/{category}-style pages without a
  // separate endpoint: GET /brands/:slug?category=... or GET /categories/:slug?brand=...
  category: z.string().optional(),
  brand: z.string().optional(),
  // In-page facets (the filter sheet). Distinct from the single `brand` cross-nav
  // filter above — `brands` is a multi-select and only meaningful on
  // GET /categories/:slug (a brand's own page is already scoped to one brand).
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().positive().optional(),
  brands: z
    .string()
    .optional()
    .transform((s) => (s ? s.split(',').filter(Boolean) : undefined)),
  minRating: z.coerce.number().min(0).max(5).optional(),
  // Real, data-driven spec facets (see CategoryFacet / GET .../facets) —
  // "key1:val1|val2,key2:val3", each key/value component percent-encoded by
  // the caller. OR within a key, AND across keys.
  specs: z
    .string()
    .optional()
    .transform((s) => {
      if (!s) return undefined;
      const result: Record<string, string[]> = {};
      for (const group of s.split(',')) {
        const idx = group.indexOf(':');
        if (idx === -1) continue;
        const key = decodeURIComponent(group.slice(0, idx));
        const values = group
          .slice(idx + 1)
          .split('|')
          .map(decodeURIComponent)
          .filter(Boolean);
        if (key && values.length) result[key] = values;
      }
      return Object.keys(result).length ? result : undefined;
    }),
});
export type CatalogDetailInput = z.infer<typeof catalogDetailSchema>;
