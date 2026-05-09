# NeuronHire Dynamic Data Implementation Guide

## ✅ COMPLETED - Backend API Endpoints

### New Routes Created:
1. **`/api/stats/platform`** - Public platform statistics (landing page)
2. **`/api/stats/admin`** - Admin dashboard statistics
3. **`/api/stats/admin/revenue`** - Revenue chart data
4. **`/api/stats/admin/activity`** - Real-time activity feed
5. **`/api/featured/engineers`** - Featured engineers (landing page)
6. **`/api/featured/products`** - Featured marketplace products
7. **`/api/featured/bounties`** - Featured bounties/tasks
8. **`/api/dashboard/engineer`** - Engineer dashboard stats
9. **`/api/dashboard/engineer/recommended-bounties`** - Recommended bounties
10. **`/api/dashboard/engineer/activity`** - Engineer activity feed
11. **`/api/dashboard/company`** - Company dashboard stats
12. **`/api/dashboard/company/pending-submissions`** - Pending submissions

### Redis Caching Implemented:
- Platform stats: 5 minutes TTL
- Featured content: 10 minutes TTL
- Dashboard stats: 1 minute TTL
- Admin stats: 1 minute TTL
- Revenue data: 1 hour TTL

## 🔄 IN PROGRESS - Frontend Integration

### Files to Update:

#### 1. Landing Page (`apps/web/src/app/page.tsx`)
**Replace:**
- Hardcoded platform stats → `GET /api/stats/platform`
- Mock featured engineers → `GET /api/featured/engineers`
- Mock featured products → `GET /api/featured/products`
- Mock featured bounties → `GET /api/featured/bounties`

#### 2. Engineer Dashboard (`apps/web/src/app/engineer/dashboard/page.tsx`)
**Replace:**
- Mock dashboard stats → `GET /api/dashboard/engineer`
- Mock recommended bounties → `GET /api/dashboard/engineer/recommended-bounties`
- Mock activity feed → `GET /api/dashboard/engineer/activity`

#### 3. Company Dashboard (`apps/web/src/app/company/dashboard/page.tsx`)
**Replace:**
- Mock dashboard stats → `GET /api/dashboard/company`
- Mock pending submissions → `GET /api/dashboard/company/pending-submissions`

#### 4. Admin Dashboard (`apps/web/src/app/(admin)/admin/page.tsx`)
**Replace:**
- `MOCK_PLATFORM_STATS` → `GET /api/stats/admin`
- `MOCK_REVENUE_DATA` → `GET /api/stats/admin/revenue`
- `MOCK_ACTIVITY` → `GET /api/stats/admin/activity`
- `MOCK_ADMIN_ENGINEERS` → Existing `/api/admin/engineers` endpoint
- `MOCK_ADMIN_ASSESSMENTS` → Existing `/api/admin/assessments` endpoint
- `MOCK_ADMIN_DISPUTES` → Existing `/api/admin/disputes` endpoint

#### 5. Marketplace Pages
**Replace:**
- `MOCK_PRODUCTS` → Existing `/api/products` endpoint
- `MOCK_REVIEWS` → Existing `/api/products/:id/reviews` endpoint
- `MOCK_ANALYTICS` → Existing `/api/products/:id/analytics` endpoint

#### 6. Bounty/Task Pages
**Replace:**
- `MOCK_BOUNTIES` → Existing `/api/tasks` endpoint
- `MOCK_BOUNTY_DETAIL` → Existing `/api/tasks/:id` endpoint

#### 7. Hiring/Contract Pages
**Replace:**
- `MOCK_ENGINEERS` → Existing `/api/search/engineers` endpoint
- `MOCK_CONTRACT` → Existing `/api/contracts/:id` endpoint
- `MOCK_CONVERSATIONS` → Existing `/api/messages` endpoint

#### 8. Public Profile Pages
**Replace:**
- `MOCK_ENGINEER` → Existing `/api/engineer/:id` endpoint
- `MOCK_COMPANY` → Existing `/api/company/:id` endpoint

## 📋 TODO - Remaining Tasks

### Backend:
- [ ] Add tracking events (profile views, search impressions, clicks)
- [ ] Implement BullMQ jobs for async tracking
- [ ] Add WebSocket events for real-time notifications
- [ ] Implement search impression logging
- [ ] Add product view tracking

### Frontend:
- [ ] Remove all mock data files:
  - `apps/web/src/lib/mock-data.ts`
  - `apps/web/src/lib/marketplace-data.ts`
  - `apps/web/src/lib/hiring-data.ts`
  - `apps/web/src/lib/bounty-data.ts`
  - `apps/web/src/lib/admin-data.ts`
  - `apps/web/src/lib/payments-analytics-data.ts`

- [ ] Update all pages to use real API calls
- [ ] Add loading states (skeletons) everywhere
- [ ] Add error states with retry buttons
- [ ] Add empty states with helpful messages
- [ ] Remove environment-specific mock fallbacks

### Testing:
- [ ] Run seed: `cd apps/api && npm run seed:fresh`
- [ ] Test all endpoints with seeded data
- [ ] Verify loading states work
- [ ] Verify error handling works
- [ ] Test with empty database states
- [ ] Run type check: `npm run typecheck`
- [ ] Run tests: `npm test`

## 🚀 Deployment Checklist

1. **Database:**
   ```bash
   cd apps/api
   npx prisma migrate deploy
   npm run seed
   ```

2. **Environment Variables:**
   - Ensure all API URLs are correct
   - Redis connection configured
   - MongoDB connection configured
   - Typesense configured (optional)

3. **Verification:**
   - [ ] Landing page shows real stats
   - [ ] Engineer dashboard shows real data
   - [ ] Company dashboard shows real data
   - [ ] Admin dashboard shows real data
   - [ ] Marketplace shows real products
   - [ ] Bounty feed shows real tasks
   - [ ] Search returns real engineers
   - [ ] Messages show real conversations
   - [ ] Contracts show real data
   - [ ] Wallet shows real balance

## 📊 API Response Examples

### Platform Stats:
```json
{
  "totalEngineers": 8,
  "verifiedEngineers": 5,
  "activeEngineers": 7,
  "totalCompanies": 4,
  "activeContracts": 2,
  "completedContracts": 1,
  "totalBounties": 5,
  "activeBounties": 3,
  "totalPaidOut": 256000
}
```

### Engineer Dashboard:
```json
{
  "activeContracts": { "count": 1, "trend": 0 },
  "pendingProposals": { "count": 2, "trend": 0 },
  "marketplaceRevenue": { "amount": 4999, "trend": 100 },
  "unreadMessages": { "count": 2 },
  "walletBalance": 126000
}
```

### Featured Engineers:
```json
[
  {
    "id": "...",
    "name": "Arjun Sharma",
    "headline": "Senior AI engineer specialising in LLM applications...",
    "location": "Bengaluru, India",
    "neuronScore": 820,
    "neuronTier": "elite",
    "hourlyRate": 4500,
    "availabilityStatus": "available_now",
    "skills": ["Python", "LangChain", "OpenAI API"],
    "rating": 4.8,
    "reviewCount": 3,
    "completedProjects": 2,
    "productsPublished": 1
  }
]
```

## 🔧 Troubleshooting

### Issue: API returns empty arrays
**Solution:** Run the seed script: `npm run seed`

### Issue: Redis connection error
**Solution:** Ensure Redis is running: `redis-server`

### Issue: Stale cached data
**Solution:** Clear Redis cache: `redis-cli FLUSHALL`

### Issue: TypeScript errors
**Solution:** Regenerate Prisma client: `npx prisma generate`

## 📝 Notes

- All endpoints use Redis caching for performance
- Cache TTLs are optimized per endpoint type
- Expensive aggregations are cached longer
- Real-time data (messages, notifications) bypass cache
- All monetary values are in INR (paise stored as Decimal)
- Dates are returned in ISO 8601 format
- Relative timestamps calculated server-side for consistency
