import { PrismaClient } from "@prisma/client";
import Redis from "ioredis";
import { hasTestDatabase } from "./db-test-flag";

// Test environment — only used when globalSetup probed a reachable Postgres
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  "postgresql://postgres:postgres@127.0.0.1:5432/neuronhire";
process.env.REDIS_URL =
  process.env.TEST_REDIS_URL || "redis://127.0.0.1:6379/1";

let prisma: PrismaClient;
let redis: Redis;

const dbAvailable = hasTestDatabase();

// Hooks must not run when DB suites are skipped — importing this file registers them globally.
if (dbAvailable) {
  beforeAll(async () => {
    prisma = new PrismaClient();
    redis = new Redis(process.env.REDIS_URL as string, {
      maxRetriesPerRequest: 1,
      connectTimeout: 3000,
      lazyConnect: true,
    });
    await redis.connect();
  });

  afterEach(async () => {
    await redis.flushdb();
    const tablenames = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename FROM pg_tables WHERE schemaname='public'
    `;
    for (const { tablename } of tablenames) {
      if (tablename !== "_prisma_migrations") {
        try {
          await prisma.$executeRawUnsafe(
            `TRUNCATE TABLE "public"."${tablename}" CASCADE;`,
          );
        } catch {
          // ignore
        }
      }
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await redis.quit();
  });
}

export { prisma, redis };

export const createTestUser = async (
  data?: Partial<{
    email: string;
    clerkId: string;
    role: "engineer" | "company" | "admin";
    isEmailVerified: boolean;
  }>,
) => {
  return await prisma.user.create({
    data: {
      email: data?.email ?? `test${Date.now()}@test.com`,
      clerkId: data?.clerkId ?? `clerk_${Date.now()}`,
      role: data?.role ?? "engineer",
      isEmailVerified: data?.isEmailVerified ?? true,
    },
  });
};

export const createTestEngineerProfile = async (
  userId: string,
  data?: Partial<{
    fullName: string;
    bio: string;
  }>,
) => {
  return await prisma.engineerProfile.create({
    data: {
      userId,
      fullName: data?.fullName ?? "Test Engineer",
      bio: data?.bio ?? "Test bio",
    },
  });
};

export const createTestCompanyProfile = async (
  userId: string,
  data?: Partial<{
    companyName: string;
    description: string;
    industry: string;
  }>,
) => {
  return await prisma.companyProfile.create({
    data: {
      userId,
      companyName: data?.companyName ?? "Test Company",
      description: data?.description,
      industry: data?.industry ?? "Technology",
    },
  });
};

export const createTestTask = async (
  userId: string,
  companyProfileId: string,
  data?: Partial<{
    title: string;
    type: "bounty" | "direct" | "contest";
    status: string;
    rewardAmount: number;
  }>,
) => {
  return await prisma.task.create({
    data: {
      userId,
      companyProfileId,
      title: data?.title ?? "Test Task",
      type: data?.type ?? "bounty",
      status: (data?.status ?? "draft") as any,
      problemStatement: "Test problem",
      expectedOutcome: "Test outcome",
      deliverables: [],
      techRequirements: [],
      timeline: 7,
      rewardAmount: data?.rewardAmount ?? 1000,
      paymentType: "fixed",
      selectionCriteria: {},
      difficulty: "medium",
    },
  });
};

export const generateTestJWT = (userId: string, role = "engineer"): string => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const jwt = require("jsonwebtoken");
  return jwt.sign(
    { sub: userId, userId, role },
    process.env.JWT_SECRET ?? "test-secret-key-for-testing-only-32chars",
    { expiresIn: "15m" },
  );
};

export const waitFor = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const createTestContract = async (data: {
  companyUserId: string;
  engineerUserId: string;
  totalAmount?: number;
  [key: string]: unknown;
}) => {
  // Get or create company profile
  const companyUser = await prisma.user.findUnique({
    where: { id: data.companyUserId },
    include: { companyProfile: true },
  });
  const companyProfileId =
    companyUser?.companyProfile?.id ??
    (
      await prisma.companyProfile.create({
        data: { userId: data.companyUserId, companyName: "Test Company" },
      })
    ).id;

  // Get or create engineer profile
  const engineerUser = await prisma.user.findUnique({
    where: { id: data.engineerUserId },
    include: { engineerProfile: true },
  });
  const engineerProfileId =
    engineerUser?.engineerProfile?.id ??
    (
      await prisma.engineerProfile.create({
        data: { userId: data.engineerUserId, fullName: "Test Engineer" },
      })
    ).id;

  return await prisma.contract.create({
    data: {
      companyUserId: data.companyUserId,
      engineerUserId: data.engineerUserId,
      companyProfileId,
      engineerProfileId,
      hiringMode: (data.type as any) ?? "project_contract",
      title: "Test Contract",
      scope: "Test scope",
      rate: data.totalAmount ?? 10000,
      status: ((data.status as string) ?? "active") as any,
      totalAmount: data.totalAmount ?? 10000,
      startDate: (data.startDate as Date) ?? new Date(),
    },
  });
};

export const mockRazorpayWebhook = (event: string, data: unknown) => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const crypto = require("crypto");
  const payload = JSON.stringify({ event, payload: data });
  const signature = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET ?? "test-secret")
    .update(payload)
    .digest("hex");
  return { payload: JSON.parse(payload), signature };
};
