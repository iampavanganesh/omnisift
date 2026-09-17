// C:\omnisift_final\apps\backend\src\modules\alerts\presentation\validators\price-alert.schemas.ts
import { z } from 'zod';

export const createAlertSchema = z
  .object({
    productId: z.string().uuid(), // internal Product UUID (from compare/product detail)
    type: z.enum(['ANY_DROP', 'BELOW_TARGET']).default('ANY_DROP'),
    targetPrice: z.coerce.number().positive().nullable().optional(),
  })
  .refine((d) => d.type !== 'BELOW_TARGET' || (d.targetPrice != null && d.targetPrice > 0), {
    message: 'targetPrice (> 0) is required for BELOW_TARGET alerts',
    path: ['targetPrice'],
  });
export type CreateAlertBody = z.infer<typeof createAlertSchema>;

export const toggleAlertSchema = z.object({ isActive: z.boolean() });
export type ToggleAlertBody = z.infer<typeof toggleAlertSchema>;
