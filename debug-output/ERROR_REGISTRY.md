# NeuronHire Error Registry

**Discovery date:** 2026-05-26  
**Total errors found:** 12 actionable (plus 39 lint warnings, 6 ESLint web warnings)

## CATEGORY A — BUILD BLOCKERS

### A-1: Invalid Supabase DATABASE_URL (API cannot start)
- **File:** `apps/api/.env` (overridden only via `.env.local`)
- **Error:** `FATAL: (ENOTFOUND) tenant/user postgres.aibetcqelhedigcryrxh not found`
- **Root cause:** Supabase project ref in `DATABASE_URL` no longer exists or URL is wrong.
- **Fix:** Set a valid `DATABASE_URL` in `apps/api/.env.local` (see `.env.local.example`). Use Docker Postgres (`docker compose up -d postgres`) or a new Supabase project connection string.
- **Status:** ❌ Requires user credentials — **blocks all API flows**

### A-2: Missing `turbo.json` (root `npm run dev` / `lint` failed)
- **File:** repo root
- **Error:** `Could not find turbo.json`
- **Fix:** Added `turbo.json` + `dev:api` / `dev:web` scripts
- **Status:** ✅ Fixed

## CATEGORY B — RUNTIME CRASHES

### B-1: BullMQ connecting to localhost:6379 when Redis unavailable
- **File:** `assessment.service.ts`, `task-ai-enrichment.service.ts`, workers
- **Error:** `ECONNREFUSED 127.0.0.1:6379`
- **Fix:** `getBullMQConnection()` + inline processing when `REDIS_URL=memory://`
- **Status:** ✅ Fixed

### B-2: Missing `/api/notifications` route
- **File:** `apps/web` → `useNotifications()`
- **Error:** 404 on notifications fetch
- **Fix:** Added `notifications.routes.ts` (returns empty list until Prisma model exists)
- **Status:** ✅ Fixed

## CATEGORY C — TYPE ERRORS

- **API:** 0 errors after fixes (`npm run typecheck`)
- **Web:** 0 errors (`npx tsc --noEmit`)
- **Status:** ✅ Fixed

## CATEGORY D — INTEGRATION ERRORS

### D-1: Redis required at startup
- **Fix:** `REDIS_URL=memory://` in-memory adapter
- **Status:** ✅ Fixed

### D-2: MongoDB required at startup
- **Fix:** Optional in development (warn and continue)
- **Status:** ✅ Fixed

### D-3: Typesense optional
- **Status:** ✅ Already graceful

## CATEGORY E — CONFIGURATION ERRORS

### E-1: Malformed `.env.example` DATABASE_URL (password `@` unencoded)
- **Fix:** Updated to `postgresql://postgres:postgres@localhost:5432/neuronhire`
- **Status:** ✅ Fixed

### E-2: `.env.local` not loaded
- **Fix:** `dotenv` loads `.env.local` with override in `env.ts`
- **Status:** ✅ Fixed

### E-3: Docker not installed on dev machine
- **Impact:** Cannot use `docker-compose.yml` without Docker Desktop
- **Workaround:** New Supabase project + `DATABASE_URL` in `.env.local`
- **Status:** ⚠️ User action

## CATEGORY F — LOGIC ERRORS

### F-1: `api-hooks` not unwrapping `{ success, data }`
- **Status:** ✅ Fixed (prior session)

### F-2: `useMyContracts` wrong path `/api/contracts/me`
- **Status:** ✅ Fixed (prior session)

## CATEGORY G — MISSING 'use client'

- Build completed with no directive errors
- **Status:** ✅ No blockers found

## CATEGORY H — IMPORT ERRORS

- **Status:** ✅ None (tsc clean)

## CATEGORY I — DATABASE ERRORS

### I-1: Prisma migrate status fails (same as A-1)
- **Status:** ❌ Blocked on valid `DATABASE_URL`

### I-2: No migration folder (uses `db push`)
- **Status:** ⚠️ By design — run `npx prisma db push` after DB is up

## CATEGORY J — ASYNC ERRORS

### J-1: OTP rate limiter threw when Redis down
- **Fix:** try/catch like global rate limiter
- **Status:** ✅ Fixed

---

## SUMMARY TABLE

| Category | Found | Fixed | Remaining |
|----------|-------|-------|-----------|
| A - Build blockers | 2 | 1 | 1 (DATABASE_URL) |
| B - Runtime crashes | 2 | 2 | 0 |
| C - Type errors | 0 | — | 0 |
| D - Integration | 3 | 3 | 0 |
| E - Configuration | 3 | 2 | 1 (Docker optional) |
| F - Logic | 2 | 2 | 0 |
| G - use client | 0 | — | 0 |
| H - Imports | 0 | — | 0 |
| I - Database | 2 | 0 | 2 (need valid DB) |
| J - Async | 1 | 1 | 0 |
| **TOTAL** | **15** | **11** | **4** (DB-dependent) |

---

## Verification Results

| Check | Result |
|-------|--------|
| API `tsc --noEmit` | ✅ 0 errors |
| Web `tsc --noEmit` | ✅ 0 errors |
| API `npm run build` | ✅ Pass |
| Web `npm run build` | ✅ Pass (warnings only) |
| API tests | ✅ 38 pass, 13 skipped |
| API lint | ⚠️ 39 warnings, 0 errors |
| Web lint | ⚠️ 6 warnings, 0 errors |
| Prisma validate | ✅ Valid schema |
| Prisma migrate | ❌ Invalid Supabase tenant |
| API `npm run dev` | ❌ DB connection |
| Web `npm run dev` | ✅ http://localhost:3000 |

---

## To run the project locally

1. **Fix database** — add to `apps/api/.env.local`:
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/neuronhire"
   REDIS_URL=memory://
   ```
   (Use your real Supabase URL if not using Docker.)

2. **Start Postgres** (if using Docker): `docker compose up -d postgres`

3. **Initialize DB:** `cd apps/api && npx prisma db push && npm run seed`

4. **Run apps:**
   ```bash
   npm run dev:api   # http://localhost:3001
   npm run dev:web   # http://localhost:3000
   ```

---

## Known Remaining (deferred)

- E2E flows not verified (blocked by database)
- 11 pages still use mock data (non-blocking for startup)
- `TESTING_REPORT.md` not created
- Console.log in tests/setup (acceptable)
