import { z } from 'zod';

export const similarProductSchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).optional().default(8),
});
export type SimilarProductInput = z.infer<typeof similarProductSchema>;
