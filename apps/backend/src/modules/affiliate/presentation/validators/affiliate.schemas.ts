import { z } from 'zod';

// No targetUrl here on purpose — a client-supplied destination is never
// trusted or persisted as if it were verified. The server derives the real
// destination from the matching ProductListing; see
// prisma-affiliate-click.repository.ts.
export const recordClickSchema = z.object({
  productId: z.string().min(1),
  platform: z.string().min(1),
});
export type RecordClickBody = z.infer<typeof recordClickSchema>;

export const clickHistorySchema = z.object({
  page: z.coerce.number().int().min(0).optional().default(0),
  pageSize: z.coerce.number().int().min(1).max(50).optional().default(20),
});
export type ClickHistoryInput = z.infer<typeof clickHistorySchema>;
