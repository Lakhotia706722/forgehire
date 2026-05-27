import fs from "fs";
import path from "path";
import { config as loadEnv } from "dotenv";
import { PrismaClient } from "@prisma/client";

const FLAG_FILE = path.join(__dirname, ".test-db-flag");

/**
 * Probes Postgres before DB integration tests run.
 * Uses TEST_DATABASE_URL only — never production DATABASE_URL (tests truncate tables).
 * Writes `.test-db-flag` so test files can skip cleanly when DB is down.
 */
export default async function globalSetup() {
  loadEnv({ path: path.join(__dirname, "../../.env") });

  const url =
    process.env.TEST_DATABASE_URL ||
    "postgresql://postgres:postgres@127.0.0.1:5432/neuronhire";

  process.env.TEST_DATABASE_URL = url;
  process.env.DATABASE_URL = url;

  const prisma = new PrismaClient({
    datasources: { db: { url } },
  });
  let available = false;
  try {
    await prisma.$connect();
    available = true;
  } catch {
    available = false;
  } finally {
    await prisma.$disconnect().catch(() => undefined);
  }

  fs.writeFileSync(FLAG_FILE, available ? "1" : "0", "utf8");
}
