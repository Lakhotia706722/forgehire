# Module 4: Setup Checklist

## ✅ Code Implementation (COMPLETE)
- [x] Task service with all methods
- [x] Razorpay escrow service
- [x] Task AI enrichment service
- [x] NDA generator service
- [x] Task routes (15 endpoints)
- [x] Task validators (Zod schemas)
- [x] Task enrichment worker (BullMQ)
- [x] Unit tests
- [x] Integration tests
- [x] Database schema updated
- [x] Environment config updated
- [x] Documentation complete

## 📋 Setup Steps (TODO)

### Step 1: Install Dependencies
```bash
npm install --legacy-peer-deps
```
**Expected:** All packages installed including razorpay, @types/razorpay

### Step 2: Generate Prisma Client
```bash
cd apps/api
npm run db:generate
```
**Expected:** Prisma client generated with Task, TaskParticipation, TaskSubmission, TaskQuestion, TaskNDASignature models

### Step 3: Run Database Migrations
```bash
cd apps/api
npm run db:migrate
```
**Expected:** All Module 4 tables created in database

### Step 4: Configure Environment
Edit `apps/api/.env` and add:
```env
# Razorpay (Module 4)
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=your-secret-key
RAZORPAY_ACCOUNT_NUMBER=your-account-number
```

### Step 5: Verify TypeScript Compilation
```bash
cd apps/api
npx tsc --noEmit
```
**Expected:** No errors (or only errors related to missing dependencies if not installed)

### Step 6: Run Tests
```bash
cd apps/api
npm test -- task.test.ts
npm test -- task-flow.test.ts
```
**Expected:** All tests pass

### Step 7: Start Services
```bash
# Terminal 1 - API Server
cd apps/api
npm run dev

# Terminal 2 - Task Enrichment Worker
cd apps/api
npm run worker:task
```
**Expected:** Both services start without errors

### Step 8: Test API
```bash
# Health check
curl http://localhost:3001/health

# Should return: {"success": true, "data": {...}}
```

## 🔧 Optional: Production Setup

### For Actual Razorpay Payouts
1. Sign up for RazorpayX account
2. Get production credentials
3. Update `razorpay-escrow.service.ts` with actual payout API calls
4. Test in Razorpay test mode first

### For Production Deployment
1. Set up production database
2. Configure production Redis
3. Set up MongoDB Atlas
4. Configure AWS S3
5. Set up Anthropic API key
6. Deploy API server
7. Deploy workers
8. Set up monitoring

## 🐛 Troubleshooting

### Issue: "Cannot find module '@neuronhire/shared'"
**Solution:** Run `npm install --legacy-peer-deps` from project root

### Issue: "Cannot find namespace 'Typesense'"
**Solution:** Install dependencies, then run `npm run db:generate`

### Issue: Prisma client errors
**Solution:** Run `npm run db:generate` in apps/api

### Issue: Database connection errors
**Solution:** Check DATABASE_URL in .env file

### Issue: Razorpay errors
**Solution:** Verify RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env

## 📊 Verification Checklist

- [ ] Dependencies installed successfully
- [ ] Prisma client generated
- [ ] Database migrations run
- [ ] Environment variables configured
- [ ] TypeScript compiles without errors
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] API server starts
- [ ] Task worker starts
- [ ] Health endpoint responds
- [ ] Can create task (with auth)
- [ ] Can view task feed
- [ ] AI enrichment works

## 📚 Reference Documents

- [Module 4 Completion Report](./MODULE_4_COMPLETION.md)
- [Module 4 API Reference](./MODULE_4_API_REFERENCE.md)
- [Module 4 Summary](./MODULE_4_SUMMARY.md)
- [Fixes Applied](./MODULE_4_FIXES_APPLIED.md)
- [Final Project Status](./FINAL_PROJECT_STATUS.md)

## 🎯 Quick Start Command

```bash
# One-liner to set up everything (after configuring .env)
npm install --legacy-peer-deps && \
cd apps/api && \
npm run db:generate && \
npm run db:migrate && \
npm run dev
```

---

**Current Status:** Code complete, ready for dependency installation and setup.
