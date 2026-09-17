import { z } from 'zod';

export const dealsSchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});
export type DealsInput = z.infer<typeof dealsSchema>;
