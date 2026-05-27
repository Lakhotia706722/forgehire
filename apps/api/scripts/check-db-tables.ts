/**
 * Verifies Postgres connectivity and whether Prisma tables exist.
 * Run: npm run db:check
 */
import dotenv from "dotenv";
import path from "path";

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

import { PrismaClient } from "@prisma/client";

async function main() {
  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    console.log("✅ Database connected");

    const rows = await prisma.$queryRaw<
      { table_name: string }[]
    >`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name`;

    const tables = rows.map((r) => r.table_name);
    console.log(`📋 Public tables (${tables.length}):`, tables.slice(0, 10).join(", ") || "(none)");

    const required = ["users", "engineer_profiles", "tasks", "products"];
    const missing = required.filter((t) => !tables.includes(t));

    if (missing.length === 0) {
      console.log("✅ Core tables present — run: npm run seed");
      process.exit(0);
    }

    console.error("\n❌ Missing tables:", missing.join(", "));
    console.error(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Schema not applied to this database.

  Option A — Supabase Dashboard (recommended if db push hangs):
    1. Open Supabase → SQL Editor
    2. Paste contents of apps/api/schema.sql
    3. Run, then: cd apps/api && npm run seed

  Option B — Prisma (use Session pooler URL from Supabase):
    cd apps/api
    npx prisma db push --accept-data-loss

  Option C — Local Postgres (if installed on :5432):
    Set in apps/api/.env.local:
      DATABASE_URL="postgresql://USER:PASS@localhost:5432/neuronhire"
    npx prisma db push && npm run seed
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("❌", err instanceof Error ? err.message : err);
  process.exit(1);
});
