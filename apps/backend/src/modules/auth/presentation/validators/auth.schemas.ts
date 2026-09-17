import { z } from 'zod';

export const registerSchema = z.object({
  fullName: z.string().min(1).max(120),
  email: z.string().email(),
  password: z
    .string()
    .min(8, 'at least 8 characters')
    .regex(/[A-Z]/, 'one uppercase letter')
    .regex(/[a-z]/, 'one lowercase letter')
    .regex(/[0-9]/, 'one number'),
});
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export const refreshSchema = z.object({ refreshToken: z.string().min(1) });
export const forgotSchema = z.object({ email: z.string().email() });

export const googleSchema = z.object({
  idToken: z.string().min(1),
  accessToken: z.string().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type ForgotInput = z.infer<typeof forgotSchema>;

export type GoogleInput = z.infer<typeof googleSchema>;
