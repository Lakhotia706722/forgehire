import { FastifyRequest, FastifyReply } from 'fastify';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
// import { getEnv } from '../config/env';

/**
 * Security headers middleware
 * Implements CSP, HSTS, X-Frame-Options, etc.
 */
export async function securityHeaders(app: any) {
  // Helmet for security headers
  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", 'https://checkout.razorpay.com'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        imgSrc: ["'self'", 'data:', 'https:', 'https://neuronhire-uploads.s3.amazonaws.com'],
        connectSrc: [
          "'self'",
          'https://api.neuronhire.com',
          'wss://api.neuronhire.com',
          'https://api.razorpay.com'
        ],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'", 'https://neuronhire-uploads.s3.amazonaws.com'],
        frameSrc: ["'self'", 'https://api.razorpay.com'],
        frameAncestors: ["'none'"]
      }
    },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    },
    referrerPolicy: {
      policy: 'strict-origin-when-cross-origin'
    }
  });
}

/**
 * Enhanced rate limiting with endpoint-specific limits
 */
export async function setupRateLimiting(app: any) {
  // Global rate limit
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    redis: app.redis,
    nameSpace: 'global-rate-limit:',
    skipOnError: true
  });
}

/**
 * Endpoint-specific rate limiters
 */
export const assessmentRateLimit = {
  max: 1,
  timeWindow: '1 hour',
  keyGenerator: (req: FastifyRequest) => {
    const user = (req as any).user;
    const params = req.params as any;
    return `assessment:${user?.id}:${params?.id}`;
  },
  errorResponseBuilder: () => {
    return {
      statusCode: 429,
      error: 'Too Many Requests',
      message: 'You can only attempt this assessment once per session'
    };
  }
};

export const otpRateLimit = {
  max: 3,
  timeWindow: '10 minutes',
  keyGenerator: (req: FastifyRequest) => {
    const body = req.body as any;
    return `otp:${body?.email || body?.phone}`;
  },
  errorResponseBuilder: () => {
    return {
      statusCode: 429,
      error: 'Too Many Requests',
      message: 'Maximum 3 OTP requests per 10 minutes'
    };
  }
};

export const payoutRateLimit = {
  max: 5,
  timeWindow: '1 day',
  keyGenerator: (req: FastifyRequest) => {
    const user = (req as any).user;
    return `payout:${user?.id}`;
  },
  errorResponseBuilder: () => {
    return {
      statusCode: 429,
      error: 'Too Many Requests',
      message: 'Maximum 5 payout requests per day'
    };
  }
};

export const loginRateLimit = {
  max: 5,
  timeWindow: '15 minutes',
  keyGenerator: (req: FastifyRequest) => {
    const body = req.body as any;
    return `login:${body?.email}:${req.ip}`;
  },
  errorResponseBuilder: () => {
    return {
      statusCode: 429,
      error: 'Too Many Requests',
      message: 'Too many login attempts. Please try again in 15 minutes'
    };
  }
};

/**
 * XSS protection middleware
 */
export async function xssProtection(
  request: FastifyRequest,
  _reply: FastifyReply
) {
  if (request.body) {
    request.body = sanitizeObject(request.body);
  }
  if (request.query) {
    request.query = sanitizeObject(request.query);
  }
}

/**
 * Sanitize object recursively
 */
function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      sanitized[key] = sanitizeObject(obj[key]);
    }
    return sanitized;
  }
  return obj;
}

/**
 * Sanitize string (basic XSS prevention)
 */
function sanitizeString(str: string): string {
  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * CSRF protection middleware
 */
export async function csrfProtection(
  request: FastifyRequest,
  reply: FastifyReply
) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    return;
  }

  const csrfToken = request.headers['x-csrf-token'] as string;
  const session = (request as any).session;
  const sessionToken = session?.csrfToken;

  if (!csrfToken || csrfToken !== sessionToken) {
    reply.code(403).send({
      error: 'Forbidden',
      message: 'Invalid CSRF token'
    });
    return;
  }
}

/**
 * Generate CSRF token
 */
export function generateCSRFToken(): string {
  return require('crypto').randomBytes(32).toString('hex');
}

/**
 * Device fingerprinting for suspicious activity detection
 */
export interface DeviceFingerprint {
  userAgent: string;
  ip: string;
  acceptLanguage: string;
  acceptEncoding: string;
}

export function getDeviceFingerprint(request: FastifyRequest): DeviceFingerprint {
  return {
    userAgent: request.headers['user-agent'] || '',
    ip: request.ip,
    acceptLanguage: request.headers['accept-language'] || '',
    acceptEncoding: request.headers['accept-encoding'] || ''
  };
}

/**
 * Check for suspicious activity
 */
export async function checkSuspiciousActivity(
  userId: string,
  currentFingerprint: DeviceFingerprint,
  redis: any
): Promise<boolean> {
  const key = `device:${userId}`;
  const stored = await redis.get(key);

  if (!stored) {
    // First login, store fingerprint
    await redis.set(key, JSON.stringify(currentFingerprint), 'EX', 60 * 60 * 24 * 30); // 30 days
    return false;
  }

  const storedFingerprint: DeviceFingerprint = JSON.parse(stored);

  // Check for IP change
  if (storedFingerprint.ip !== currentFingerprint.ip) {
    return true;
  }

  // Check for user agent change
  if (storedFingerprint.userAgent !== currentFingerprint.userAgent) {
    return true;
  }

  return false;
}

/**
 * Admin role verification
 */
export async function requireAdmin(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const user = (request as any).user;
  if (!user) {
    reply.code(401).send({ error: 'Unauthorized', message: 'Authentication required' });
    return;
  }
  if (user.role !== 'admin') {
    reply.code(403).send({ error: 'Forbidden', message: 'Admin access required' });
    return;
  }
}

/**
 * Log security events
 */
export async function logSecurityEvent(
  event: string,
  userId: string | null,
  ip: string,
  details: any,
  prisma: any
) {
  try {
    await prisma.securityLog.create({
      data: {
        event,
        userId,
        ip,
        details,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}

/**
 * Validate file upload
 */
export function validateFileUpload(file: any): {
  valid: boolean;
  error?: string;
} {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/zip',
    'text/plain',
    'text/csv'
  ];

  const maxSize = 50 * 1024 * 1024; // 50MB

  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  if (!allowedMimeTypes.includes(file.mimetype)) {
    return { valid: false, error: 'File type not allowed' };
  }

  if (file.size > maxSize) {
    return { valid: false, error: 'File size exceeds 50MB limit' };
  }

  return { valid: true };
}

/**
 * Sanitize filename
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/\.{2,}/g, '.')
    .substring(0, 255);
}

/**
 * Check if request is from trusted origin
 */
export function isTrustedOrigin(origin: string): boolean {
  const trustedOrigins = [
    'https://neuronhire.com',
    'https://www.neuronhire.com',
    'https://app.neuronhire.com',
    'http://localhost:3000', // Development
    'http://localhost:3001'  // Development
  ];

  return trustedOrigins.includes(origin);
}

/**
 * CORS configuration
 */
export const corsOptions = {
  origin: (origin: string, callback: any) => {
    if (!origin || isTrustedOrigin(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset']
};
