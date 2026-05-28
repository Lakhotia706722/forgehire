import { verifyToken } from "@clerk/backend";
import { clerkClient } from "@clerk/fastify";
import { getPrismaClient } from "../config/database";
import { getRedisClient } from "../config/redis";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { getEnv } from "../config/env";
import { AuthenticationError, ValidationError } from "@neuronhire/shared";
import { UserRole } from "@prisma/client";
import { otpRateLimiter } from "../middleware/rateLimiter";

export class AuthService {
  private prisma = getPrismaClient();
  private redis = getRedisClient();
  private env = getEnv();

  async signup(email: string, role: UserRole): Promise<{ message: string }> {
    // Check OTP rate limit
    await otpRateLimiter(email);

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ValidationError("User with this email already exists");
    }

    // Create user in Clerk
    try {
      const clerkUser = await clerkClient.users.createUser({
        emailAddress: [email],
        publicMetadata: { role },
      });

      // Send OTP via Clerk
      await clerkClient.emailAddresses.createEmailAddress({
        userId: clerkUser.id,
        emailAddress: email,
        verified: false,
      });

      // Store pending signup in Redis (expires in 10 minutes)
      await this.redis.setex(
        `signup:${email}`,
        600,
        JSON.stringify({ clerkId: clerkUser.id, role }),
      );

      return { message: "OTP sent to your email" };
    } catch (error: any) {
      console.error("Clerk signup error:", error);
      throw new ValidationError("Failed to create user account");
    }
  }

  async verifyOTP(
    email: string,
    _code: string,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    // Get pending signup data
    const signupData = await this.redis.get(`signup:${email}`);

    if (!signupData) {
      throw new AuthenticationError("Invalid or expired OTP request");
    }

    const { clerkId, role } = JSON.parse(signupData);

    try {
      // Verify OTP with Clerk
      // const clerkUser = await clerkClient.users.getUser(clerkId);

      // In production, verify the actual OTP code with Clerk
      // For now, we'll simulate verification

      // Create user in our database
      const user = await this.prisma.user.create({
        data: {
          id: uuidv4(),
          clerkId,
          email,
          role,
          isEmailVerified: true,
        },
      });

      // Generate tokens
      const tokens = await this.generateTokens(user);

      // Clean up Redis
      await this.redis.del(`signup:${email}`);

      return tokens;
    } catch (error) {
      console.error("OTP verification error:", error);
      throw new AuthenticationError("Invalid OTP code");
    }
  }

  async refreshToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    try {
      // Verify refresh token
      jwt.verify(refreshToken, this.env.JWT_SECRET);

      // Check if refresh token exists in database
      const storedToken = await this.prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true },
      });

      if (!storedToken || storedToken.expiresAt < new Date()) {
        throw new AuthenticationError("Invalid or expired refresh token");
      }

      // Delete old refresh token
      await this.prisma.refreshToken.delete({
        where: { id: storedToken.id },
      });

      // Generate new tokens
      return await this.generateTokens(storedToken.user);
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error;
      }
      throw new AuthenticationError("Invalid refresh token");
    }
  }

  async logout(refreshToken: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });
  }

  /** Exchange a Clerk session JWT for Forge API tokens (used by the web app after Clerk sign-in). */
  async exchangeClerkSession(clerkToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    let clerkId: string;
    try {
      const payload = await verifyToken(clerkToken, {
        secretKey: this.env.CLERK_SECRET_KEY,
      });
      if (!payload.sub) {
        throw new AuthenticationError("Invalid Clerk session");
      }
      clerkId = payload.sub;
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error;
      }
      throw new AuthenticationError("Invalid Clerk session");
    }

    let user = await this.prisma.user.findUnique({ where: { clerkId } });
    if (!user) {
      user = await this.syncUserFromClerk(clerkId);
    }

    return this.generateTokens(user);
  }

  private async syncUserFromClerk(clerkId: string) {
    const clerkUser = await clerkClient.users.getUser(clerkId);
    const email =
      clerkUser.emailAddresses.find(
        (e) => e.id === clerkUser.primaryEmailAddressId,
      )?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress;

    if (!email) {
      throw new AuthenticationError("Clerk user has no email address");
    }

    const roleMeta = clerkUser.publicMetadata?.role;
    const role =
      roleMeta === "company" ? UserRole.company : UserRole.engineer;

    try {
      return await this.prisma.user.create({
        data: {
          id: uuidv4(),
          clerkId,
          email,
          role,
          isEmailVerified: true,
        },
      });
    } catch {
      const existing = await this.prisma.user.findUnique({ where: { clerkId } });
      if (existing) {
        return existing;
      }
      throw new ValidationError("Failed to create user account");
    }
  }

  private async generateTokens(user: any): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    const payload = {
      userId: user.id,
      clerkId: user.clerkId,
      email: user.email,
      role: user.role,
    };

    // Generate access token
    const accessToken = jwt.sign(payload, this.env.JWT_SECRET, {
      expiresIn: this.env.JWT_ACCESS_EXPIRY as any,
    });

    // Generate refresh token with a unique jti to avoid duplicate-token collisions
    // when multiple exchange requests happen within the same second.
    const refreshToken = jwt.sign(
      { userId: user.id, jti: uuidv4() },
      this.env.JWT_SECRET,
      {
      expiresIn: this.env.JWT_REFRESH_EXPIRY as any,
      },
    );

    // Store refresh token in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    await this.prisma.refreshToken.create({
      data: {
        id: uuidv4(),
        userId: user.id,
        token: refreshToken,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60, // 15 minutes in seconds
    };
  }
}
