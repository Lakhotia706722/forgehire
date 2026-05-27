import { AuthService } from "../../services/auth.service";
import { getPrismaClient } from "../../config/database";
import { getRedisClient } from "../../config/redis";
import { ValidationError, AuthenticationError } from "@neuronhire/shared";
import { UserRole } from "@prisma/client";

jest.mock("../../config/database");
jest.mock("../../config/redis");
jest.mock("../../middleware/rateLimiter");

describe("AuthService", () => {
  let authService: AuthService;
  let mockPrisma: any;
  let mockRedis: any;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      refreshToken: {
        findUnique: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
      },
    };

    mockRedis = {
      setex: jest.fn(),
      get: jest.fn(),
      del: jest.fn(),
    };

    (getPrismaClient as jest.Mock).mockReturnValue(mockPrisma);
    (getRedisClient as jest.Mock).mockReturnValue(mockRedis);

    authService = new AuthService();
  });

  describe("signup", () => {
    it("should throw error if user already exists", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "123",
        email: "test@example.com",
      });

      await expect(
        authService.signup("test@example.com", UserRole.engineer),
      ).rejects.toThrow(ValidationError);
    });
  });

  describe("verifyOTP", () => {
    it("should throw error if no pending signup data", async () => {
      mockRedis.get.mockResolvedValue(null);

      await expect(
        authService.verifyOTP("test@example.com", "123456"),
      ).rejects.toThrow(AuthenticationError);
    });
  });

  describe("logout", () => {
    it("should delete refresh token", async () => {
      mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 1 });

      await authService.logout("refresh-token");

      expect(mockPrisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { token: "refresh-token" },
      });
    });
  });
});
