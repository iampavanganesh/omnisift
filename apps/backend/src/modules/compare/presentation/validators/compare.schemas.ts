import { z } from 'zod';

export const comparisonSchema = z.object({
  token: z.string().min(1, 'product token is required'),
  // Stable Google product id — the cache key. The app already sends it. Optional
  // so old clients still work; when present, we read/write compare_cache by it.
  productId: z.string().min(1).optional(),
});
export type ComparisonInput = z.infer<typeof comparisonSchema>;
