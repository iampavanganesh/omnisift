import { z } from 'zod';

export const trendingSchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});
export type TrendingInput = z.infer<typeof trendingSchema>;

export const mostSearchedSchema = z.object({
  hours: z.coerce.number().int().min(1).max(168).optional().default(24),
  limit: z.coerce.number().int().min(1).max(50).optional().default(12),
});
export type MostSearchedInput = z.infer<typeof mostSearchedSchema>;
