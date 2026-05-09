import { UserRole } from './user';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface JWTPayload {
  userId: string;
  clerkId: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

export interface SignupRequest {
  email: string;
  role: UserRole;
}

export interface OTPVerifyRequest {
  email: string;
  code: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}
