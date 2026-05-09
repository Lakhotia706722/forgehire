// Test setup file
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/neuronhire_test?pgbouncer=true';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.MONGODB_URL = 'mongodb://localhost:27017/neuronhire_test';
process.env.TYPESENSE_HOST = 'localhost';
process.env.TYPESENSE_PORT = '8108';
process.env.TYPESENSE_PROTOCOL = 'http';
process.env.TYPESENSE_API_KEY = 'test-key';
process.env.AWS_ACCESS_KEY_ID = 'test-key-id';
process.env.AWS_SECRET_ACCESS_KEY = 'test-secret';
process.env.AWS_REGION = 'ap-south-1';
process.env.AWS_S3_BUCKET = 'test-bucket';
process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
process.env.OPENAI_API_KEY = 'sk-test';
process.env.CLERK_SECRET_KEY = 'sk_test_mock';
process.env.CLERK_PUBLISHABLE_KEY = 'pk_test_mock';
process.env.JWT_SECRET = 'test-secret-key-for-testing-only-32chars';
process.env.JWT_ACCESS_EXPIRY = '15m';
process.env.JWT_REFRESH_EXPIRY = '30d';
process.env.ALLOWED_ORIGINS = 'http://localhost:3000';
process.env.RATE_LIMIT_MAX = '100';
process.env.RATE_LIMIT_WINDOW = '60000';
process.env.OTP_RATE_LIMIT_MAX = '3';
process.env.OTP_RATE_LIMIT_WINDOW = '600000';
process.env.RAZORPAY_KEY_ID = 'rzp_test_mock';
process.env.RAZORPAY_KEY_SECRET = 'test-secret';
process.env.RAZORPAY_ACCOUNT_NUMBER = '1234567890';
process.env.RAZORPAY_WEBHOOK_SECRET = 'test-webhook-secret';
process.env.DIGIO_API_KEY = 'test-digio-key';
process.env.CLEARTAX_API_KEY = 'test-cleartax-key';
process.env.COMPANY_GSTIN = '27AAPFU0939F1ZV';

// Call validateEnv so getEnv() works in all tests
import { validateEnv } from '../config/env';
validateEnv();

// Mock Clerk client
jest.mock('@clerk/fastify', () => ({
  clerkClient: {
    users: {
      createUser: jest.fn(),
      getUser: jest.fn()
    },
    emailAddresses: {
      createEmailAddress: jest.fn()
    },
    verifyToken: jest.fn()
  }
}));
