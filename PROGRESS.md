# NeuronHire - Session Progress Tracker

**Last Updated:** May 26, 2026  
**Automated quality gates:** All green

---

## Quality gates (error-free toolchain)

| Check | Result |
|--------|--------|
| Web Jest | **405 / 405** pass |
| Web TypeScript (`tsc --noEmit`) | Pass |
| Web production build | Pass |
| Web ESLint (`next lint`) | Pass (3 `no-img-element` warnings only — not errors) |
| API TypeScript | Pass |
| API Jest (no local Postgres) | **38 pass**, 13 skipped (DB integration — run when Postgres is up) |
| IDE linter (workspace) | No errors reported |

---

## What “error-free” means here

**Yes** — the repo builds, typechecks, and all non-skipped tests pass; no blocking linter errors.

**No** — not every product feature is fully backend-integrated and E2E-tested (see below).

---

## Intentionally partial (not toolchain errors)

| Area | Status |
|------|--------|
| `/engineer/assessment` | Client demo (mock MCQ/coding) |
| Hire / escrow / signing | UI simulation; not full production payment pipeline |
| API DB integration tests | Skipped when `postgresql://postgres:postgres@127.0.0.1:5432/neuronhire` is unreachable |
| E2E (Playwright/Cypress) | Not in repo |

---

## Run locally

```bash
# Optional: enable all API tests
docker compose up -d postgres
cd apps/api && npx prisma db push && npm test

cd apps/api && npm run dev
cd apps/web && npm run dev
# http://localhost:3000
```

---

## Clerk token refresh

If you see `ClerkJS: Token refresh failed`, clear site data, unregister the service worker, restart dev servers.
