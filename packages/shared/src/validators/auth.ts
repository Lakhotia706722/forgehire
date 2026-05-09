import { z } from 'zod';

export const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['engineer', 'company'], {
    errorMap: () => ({ message: 'Role must be either engineer or company' })
  })
});

export const otpVerifySchema = z.object({
  email: z.string().email('Invalid email address'),
  code: z.string().length(6, 'OTP must be 6 digits')
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
});

export type SignupInput = z.infer<typeof signupSchema>;
export type OTPVerifyInput = z.infer<typeof otpVerifySchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
