import { FastifyInstance } from 'fastify';
import { AuthService } from '../services/auth.service';
import { successResponse } from '@neuronhire/shared';
import { signupSchema, otpVerifySchema, refreshTokenSchema } from '@neuronhire/shared';

export async function authRoutes(fastify: FastifyInstance): Promise<void> {
  const authService = new AuthService();

  // Signup endpoint
  fastify.post('/signup', async (request, _reply) => {
    const body = signupSchema.parse(request.body);
    const result = await authService.signup(body.email, body.role as any);
    return successResponse(result);
  });

  // Verify OTP endpoint
  fastify.post('/verify-otp', async (request, _reply) => {
    const body = otpVerifySchema.parse(request.body);
    const tokens = await authService.verifyOTP(body.email, body.code);
    return successResponse(tokens);
  });

  // Refresh token endpoint
  fastify.post('/refresh', async (request, _reply) => {
    const body = refreshTokenSchema.parse(request.body);
    const tokens = await authService.refreshToken(body.refreshToken);
    return successResponse(tokens);
  });

  // Logout endpoint
  fastify.post('/logout', async (request, _reply) => {
    const body = refreshTokenSchema.parse(request.body);
    await authService.logout(body.refreshToken);
    return successResponse({ message: 'Logged out successfully' });
  });

  // Google OAuth callback (handled by Clerk)
  fastify.get('/oauth/google', async (_request, _reply) => {
    // This endpoint is handled by Clerk's OAuth flow
    return successResponse({ message: 'OAuth flow initiated' });
  });
}
