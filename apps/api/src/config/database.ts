import { PrismaClient } from "@prisma/client";

let prisma: PrismaClient;

export function getPrismaClient(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      log:
        process.env.NODE_ENV === "development"
          ? ["query", "error", "warn"]
          : ["error"],
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });
  }
  return prisma;
}

export async function connectDatabase(): Promise<void> {
  try {
    const client = getPrismaClient();
    await client.$connect();
    console.log("✅ Database connected successfully");

    if (process.env.NODE_ENV === "development") {
      const rows = await client.$queryRaw<{ exists: boolean }[]>`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'users'
        ) AS exists
      `;
      if (!rows[0]?.exists) {
        console.warn(`
⚠️  Database has no tables yet (users missing).
   Run: cd apps/api && npx tsx scripts/check-db-tables.ts
   Or apply schema.sql in Supabase SQL Editor, then: npm run seed
`);
      }
    }
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    console.log("Database disconnected");
  }
}

export { prisma };
