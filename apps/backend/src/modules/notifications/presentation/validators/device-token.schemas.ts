// C:\omnisift_final\apps\backend\src\modules\notifications\presentation\validators\device-token.schemas.ts
import { z } from 'zod';

export const deviceTokenSchema = z.object({
  token: z.string().min(10),
  platform: z.enum(['android', 'ios', 'web']).nullable().optional(),
});
export type DeviceTokenBody = z.infer<typeof deviceTokenSchema>;
