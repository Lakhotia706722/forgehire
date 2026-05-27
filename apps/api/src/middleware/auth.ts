import { FastifyRequest, FastifyReply } from "fastify";
import { getPrismaClient } from "../config/database";
import { AuthenticationError, AuthorizationError } from "@neuronhire/shared";
import { UserRole } from "@prisma/client";
import jwt from "jsonwebtoken";
import { getEnv } from "../config/env";

export interface AuthenticatedRequest extends FastifyRequest {
  user?: {
    id: string;
    /** Alias for `id` — used by many route handlers */
    userId: string;
    clerkId: string;
    email: string;
    role: UserRole;
  };
}

export async function authenticate(
  request: AuthenticatedRequest,
  _reply: FastifyReply,
): Promise<void> {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AuthenticationError("Missing or invalid authorization header");
    }

    const token = authHeader.substring(7);
    const env = getEnv();

    // Verify JWT token
    let decoded: { sub?: string; userId?: string; clerkId?: string };
    try {
      decoded = jwt.verify(token, env.JWT_SECRET) as typeof decoded;
    } catch {
      throw new AuthenticationError("Invalid or expired token");
    }

    const prisma = getPrismaClient();
    let user = decoded.userId
      ? await prisma.user.findUnique({ where: { id: decoded.userId } })
      : null;

    if (!user) {
      const clerkId = decoded.sub ?? decoded.clerkId;
      if (!clerkId) {
        throw new AuthenticationError("Invalid token payload");
      }
      user = await prisma.user.findUnique({ where: { clerkId } });
    }

    if (!user) {
      throw new AuthenticationError("User not found");
    }

    request.user = {
      id: user.id,
      userId: user.id,
      clerkId: user.clerkId,
      email: user.email,
      role: user.role,
    };
  } catch (error) {
    if (error instanceof AuthenticationError) {
      throw error;
    }
    throw new AuthenticationError("Authentication failed");
  }
}

export function requireRole(...allowedRoles: UserRole[]) {
  return async (
    request: AuthenticatedRequest,
    _reply: FastifyReply,
  ): Promise<void> => {
    if (!request.user) {
      throw new AuthenticationError("User not authenticated");
    }

    if (!allowedRoles.includes(request.user.role)) {
      throw new AuthorizationError(
        `Access denied. Required roles: ${allowedRoles.join(", ")}`,
      );
    }
  };
}

export const requireEngineer = requireRole(UserRole.engineer);
export const requireCompany = requireRole(UserRole.company);
export const requireAdmin = requireRole(UserRole.admin);
export const requireEngineerOrCompany = requireRole(
  UserRole.engineer,
  UserRole.company,
);
