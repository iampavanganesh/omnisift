import { z } from 'zod';
import { PAGINATION } from '../../../../shared/constants';

export const searchSchema = z.object({
  q: z.string().min(1, 'search query is required').max(120),
  page: z.coerce
    .number()
    .int()
    .min(0)
    .max(PAGINATION.MAX_PAGES - 1)
    .optional()
    .default(0),
  // Client-side price ceiling (e.g. apps/web's "Shop by budget" chips) — applied
  // as a post-filter on the fetched page, not a cache dimension, so it never
  // touches the provider-call budget above.
  maxPrice: z.coerce.number().positive().optional(),
});
export type SearchInput = z.infer<typeof searchSchema>;
