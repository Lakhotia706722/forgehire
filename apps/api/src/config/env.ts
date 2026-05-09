import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url('Invalid DATABASE_URL'),

  // Redis
  REDIS_URL: z.string().url('Invalid REDIS_URL'),

  // MongoDB
  MONGODB_URL: z.string().url('Invalid MONGODB_URL'),

  // Typesense
  TYPESENSE_HOST: z.string().min(1, 'TYPESENSE_HOST is required'),
  TYPESENSE_PORT: z.string().transform(Number).pipe(z.number().min(1).max(65535)).default('443'),
  TYPESENSE_PROTOCOL: z.enum(['http', 'https']).default('https'),
  TYPESENSE_API_KEY: z.string().min(1, 'TYPESENSE_API_KEY is required'),

  // AWS S3
  AWS_ACCESS_KEY_ID: z.string().min(1, 'AWS_ACCESS_KEY_ID is required'),
  AWS_SECRET_ACCESS_KEY: z.string().min(1, 'AWS_SECRET_ACCESS_KEY is required'),
  AWS_REGION: z.string().default('ap-south-1'),
  AWS_S3_BUCKET: z.string().min(1, 'AWS_S3_BUCKET is required'),

  // Anthropic (Claude API)
  ANTHROPIC_API_KEY: z.string().min(1, 'ANTHROPIC_API_KEY is required'),

  // OpenAI (Moderation API)
  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY is required'),

  // Clerk
  CLERK_SECRET_KEY: z.string().min(1, 'CLERK_SECRET_KEY is required'),
  CLERK_PUBLISHABLE_KEY: z.string().min(1, 'CLERK_PUBLISHABLE_KEY is required'),

  // JWT
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('30d'),

  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).pipe(z.number().min(1).max(65535)).default('3001'),
  HOST: z.string().default('0.0.0.0'),

  // CORS
  ALLOWED_ORIGINS: z.string().default('http://localhost:3000'),

  // Rate Limiting
  RATE_LIMIT_MAX: z.string().transform(Number).pipe(z.number().min(1)).default('100'),
  RATE_LIMIT_WINDOW: z.string().transform(Number).pipe(z.number().min(1000)).default('60000'),
  OTP_RATE_LIMIT_MAX: z.string().transform(Number).pipe(z.number().min(1)).default('3'),
  OTP_RATE_LIMIT_WINDOW: z.string().transform(Number).pipe(z.number().min(1000)).default('600000'),

  // Razorpay (Module 4)
  RAZORPAY_KEY_ID: z.string().min(1, 'RAZORPAY_KEY_ID is required'),
  RAZORPAY_KEY_SECRET: z.string().min(1, 'RAZORPAY_KEY_SECRET is required'),
  RAZORPAY_ACCOUNT_NUMBER: z.string().min(1, 'RAZORPAY_ACCOUNT_NUMBER is required'),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),

  // Digio (KYC)
  DIGIO_API_KEY: z.string().optional(),

  // ClearTax (Invoices)
  CLEARTAX_API_KEY: z.string().optional(),
  COMPANY_GSTIN: z.string().optional(),

  // PagerDuty (Monitoring)
  PAGERDUTY_ROUTING_KEY: z.string().optional()
});

export type Env = z.infer<typeof envSchema>;

let env: Env;

export function validateEnv(): Env {
  try {
    env = envSchema.parse(process.env);
    console.log('✅ Environment variables validated successfully');
    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment variable validation failed:');
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
    }
    process.exit(1);
  }
}

export function getEnv(): Env;
export function getEnv<K extends keyof Env>(key: K): Env[K];
export function getEnv<K extends keyof Env>(key?: K): Env | Env[K] {
  if (!env) {
    throw new Error('Environment variables not validated. Call validateEnv() first.');
  }
  if (key) {
    return env[key];
  }
  return env;
}
