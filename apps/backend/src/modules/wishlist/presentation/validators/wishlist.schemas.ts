import { z } from 'zod';

export const saveWishlistSchema = z.object({
  productId: z.string().min(1),
  token: z.string().default(''),
  title: z.string().min(1),
  imageUrl: z.string().default(''),
  price: z.coerce.number().nonnegative(),
  platform: z.string().default(''),
  productUrl: z.string().default(''),
});
export type SaveWishlistBody = z.infer<typeof saveWishlistSchema>;
