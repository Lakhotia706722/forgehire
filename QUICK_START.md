# Quick Start - Dynamic Data Implementation

## 🚀 Get Started in 5 Minutes

### 1. Start Services (2 min)

```bash
# Terminal 1 - API
cd apps/api
npm run dev

# Terminal 2 - Web
cd apps/web
npm run dev

# Terminal 3 - Redis (if not running)
redis-server
```

### 2. Seed Database (1 min)

```bash
cd apps/api
npm run seed:fresh
```

**Expected Output:**
```
Creating users...
  Created 13 users (1 admin, 8 engineers, 4 companies)
Creating engineer profiles...
  Created 8 engineer profiles
...
✓ All sections succeeded
```

### 3. Test Backend (1 min)

Open in browser:
- http://localhost:4000/api/stats/platform
- http://localhost:4000/api/featured/engineers
- http://localhost:4000/api/featured/products

**Should see JSON responses with real data.**

### 4. Update One Component (1 min)

Open `apps/web/src/app/(public)/_sections/featured-engineers.tsx`

**Replace this:**
```typescript
const ENGINEERS = [
  { id: 'arjun', name: 'Arjun Sharma', ... },
  // mock data
];
```

**With this:**
```typescript
import { useQuery } from '@tanstack/react-query';
import { featuredApi } from '@/lib/api';

const { data: engineers, isLoading } = useQuery({
  queryKey: ['featuredEngineers'],
  queryFn: () => featuredApi.getEngineers(),
});

if (isLoading) return <Skeleton />;
```

### 5. Verify (30 sec)

Visit http://localhost:3000

**Should see:**
- Real engineer names from seed data
- Real NeuronScores
- Real skills
- Real availability status

---

## 📋 Quick Reference

### API Endpoints

```typescript
// Public (no auth)
statsApi.getPlatformStats()
featuredApi.getEngineers()
featuredApi.getProducts()
featuredApi.getBounties()

// Engineer (requires auth)
dashboardApi.getEngineerStats()
dashboardApi.getRecommendedBounties()
dashboardApi.getEngineerActivity()

// Company (requires auth)
dashboardApi.getCompanyStats()
dashboardApi.getPendingSubmissions()

// Admin (requires admin role)
statsApi.getAdminStats()
statsApi.getAdminRevenue()
statsApi.getAdminActivity()
```

### Test Accounts

```
Admin:
  Email: admin@neuronhire.in
  Password: Admin@123456

Engineer (Elite):
  Email: arjun.sharma@dev.in
  Password: Engineer@123

Company:
  Email: hr@techcorp.in
  Password: Company@123
```

### Common Commands

```bash
# Seed database
npm run seed:fresh

# Clear Redis cache
redis-cli FLUSHALL

# Regenerate Prisma client
npx prisma generate

# Check database
npx prisma studio

# Type check
npm run typecheck

# Run tests
npm test
```

### React Query Pattern

```typescript
const { data, isLoading, error, refetch } = useQuery({
  queryKey: ['uniqueKey'],
  queryFn: () => api.getData(),
  staleTime: 60000, // 1 min
});

if (isLoading) return <Skeleton />;
if (error) return <Error onRetry={refetch} />;
if (!data) return <Empty />;
return <Display data={data} />;
```

---

## 🎯 Next Steps

1. ✅ Backend is ready
2. ✅ Seed data is ready
3. ✅ API client is ready
4. 🔄 Update frontend components
5. 🔄 Delete mock data files
6. 🔄 Test everything

**See `README_DYNAMIC_DATA.md` for complete guide.**

---

## 🐛 Quick Fixes

**API 404?**
```bash
cd apps/api && npm run dev
```

**Empty data?**
```bash
cd apps/api && npm run seed:fresh
```

**Stale cache?**
```bash
redis-cli FLUSHALL
```

**TypeScript errors?**
```bash
npx prisma generate
```

---

**Time to Complete:** 2-3 hours for full frontend integration
**Difficulty:** Medium (follow the patterns)
**Help:** See `EXAMPLE_MIGRATION.md` for complete example
