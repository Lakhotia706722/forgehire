import { otpRateLimiter } from '../../middleware/rateLimiter';
import { RateLimitError } from '@neuronhire/shared';
import { getRedisClient } from '../../config/redis';

jest.mock('../../config/redis');

describe('Rate Limiter', () => {
  let mockRedis: any;

  beforeEach(() => {
    mockRedis = {
      incr: jest.fn(),
      pexpire: jest.fn(),
      pttl: jest.fn()
    };
    (getRedisClient as jest.Mock).mockReturnValue(mockRedis);
  });

  describe('otpRateLimiter', () => {
    it('should allow first OTP request', async () => {
      mockRedis.incr.mockResolvedValue(1);
      mockRedis.pexpire.mockResolvedValue(1);

      await expect(otpRateLimiter('test@example.com')).resolves.toBeUndefined();
      expect(mockRedis.incr).toHaveBeenCalledWith('rl:otp:test@example.com');
      expect(mockRedis.pexpire).toHaveBeenCalled();
    });

    it('should throw error when rate limit exceeded', async () => {
      mockRedis.incr.mockResolvedValue(4);
      mockRedis.pttl.mockResolvedValue(300000);

      await expect(otpRateLimiter('test@example.com')).rejects.toThrow(
        RateLimitError
      );
    });

    it('should allow requests within limit', async () => {
      mockRedis.incr.mockResolvedValue(2);

      await expect(otpRateLimiter('test@example.com')).resolves.toBeUndefined();
    });
  });
});
