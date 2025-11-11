import { z } from 'zod';

export const GoogleAuthSchema = z.object({
  idToken: z.string().min(1, 'ID token is required'),
});

export const EmailSignupSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required'),
});

export const EmailLoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export type GoogleAuthDto = z.infer<typeof GoogleAuthSchema>;
export type EmailSignupDto = z.infer<typeof EmailSignupSchema>;
export type EmailLoginDto = z.infer<typeof EmailLoginSchema>;
