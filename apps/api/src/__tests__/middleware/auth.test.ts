import { authenticate, requireRole } from '../../middleware/auth';
import { AuthenticationError, AuthorizationError } from '@neuronhire/shared';
import { UserRole } from '@prisma/client';

describe('Auth Middleware', () => {
  describe('authenticate', () => {
    it('should throw error when authorization header is missing', async () => {
      const mockRequest: any = {
        headers: {}
      };
      const mockReply: any = {};

      await expect(authenticate(mockRequest, mockReply)).rejects.toThrow(
        AuthenticationError
      );
    });

    it('should throw error when authorization header is invalid', async () => {
      const mockRequest: any = {
        headers: {
          authorization: 'InvalidToken'
        }
      };
      const mockReply: any = {};

      await expect(authenticate(mockRequest, mockReply)).rejects.toThrow(
        AuthenticationError
      );
    });
  });

  describe('requireRole', () => {
    it('should throw error when user is not authenticated', async () => {
      const mockRequest: any = {};
      const mockReply: any = {};
      const middleware = requireRole(UserRole.engineer);

      await expect(middleware(mockRequest, mockReply)).rejects.toThrow(
        AuthenticationError
      );
    });

    it('should throw error when user role is not allowed', async () => {
      const mockRequest: any = {
        user: {
          id: '123',
          clerkId: 'clerk_123',
          email: 'test@example.com',
          role: UserRole.company
        }
      };
      const mockReply: any = {};
      const middleware = requireRole(UserRole.engineer);

      await expect(middleware(mockRequest, mockReply)).rejects.toThrow(
        AuthorizationError
      );
    });

    it('should pass when user role is allowed', async () => {
      const mockRequest: any = {
        user: {
          id: '123',
          clerkId: 'clerk_123',
          email: 'test@example.com',
          role: UserRole.engineer
        }
      };
      const mockReply: any = {};
      const middleware = requireRole(UserRole.engineer);

      await expect(middleware(mockRequest, mockReply)).resolves.toBeUndefined();
    });

    it('should pass when user has one of multiple allowed roles', async () => {
      const mockRequest: any = {
        user: {
          id: '123',
          clerkId: 'clerk_123',
          email: 'test@example.com',
          role: UserRole.company
        }
      };
      const mockReply: any = {};
      const middleware = requireRole(UserRole.engineer, UserRole.company);

      await expect(middleware(mockRequest, mockReply)).resolves.toBeUndefined();
    });
  });
});
