import fs from "fs";
import path from "path";

const FLAG_FILE = path.join(__dirname, ".test-db-flag");

/** True when globalSetup probed a reachable Postgres (docker compose). */
export function hasTestDatabase(): boolean {
  try {
    return fs.readFileSync(FLAG_FILE, "utf8").trim() === "1";
  } catch {
    return false;
  }
}
