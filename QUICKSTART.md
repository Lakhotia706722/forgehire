# NeuronHire - Quick Start Guide

Get NeuronHire running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- Accounts created on:
  - [Supabase](https://supabase.com) (PostgreSQL)
  - [Upstash](https://upstash.com) (Redis)
  - [Clerk](https://clerk.com) (Authentication)

## 1. Install Dependencies (1 min)

```bash
npm install
```

## 2. Set Up Services (2 min)

### Supabase (Database)
1. Create project → Copy connection string (use "Connection Pooling" mode)
2. Format: `postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres?pgbouncer=true&connection_limit=10`

### Upstash (Redis)
1. Create database → Copy Redis URL
2. Format: `redis://default:[PASSWORD]@[ENDPOINT].upstash.io:6379`

### Clerk (Auth)
1. Create application
2. Enable: Email OTP + Google OAuth
3. Copy: `CLERK_SECRET_KEY` and `CLERK_PUBLISHABLE_KEY`

## 3. Configure Environment (1 min)

### Backend
```bash
cp apps/api/.env.example apps/api/.env
```

Edit `apps/api/.env`:
```env
DATABASE_URL="your-supabase-url"
REDIS_URL="your-upstash-url"
CLERK_SECRET_KEY="sk_test_xxxxx"
CLERK_PUBLISHABLE_KEY="pk_test_xxxxx"
JWT_SECRET="your-random-32-char-secret"
```

### Frontend
```bash
cp apps/web/.env.example apps/web/.env.local
```

Edit `apps/web/.env.local`:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_xxxxx"
CLERK_SECRET_KEY="sk_test_xxxxx"
```

## 4. Set Up Database (30 sec)

```bash
npm run db:generate
npm run db:push
```

## 5. Start Development (30 sec)

```bash
npm run dev
```

## 6. Test It! ✅

1. **Frontend**: http://localhost:3000
2. **Backend Health**: http://localhost:3001/health
3. **Sign Up**: Click "Get Started" and test the flow

## Common Issues

### Port Already in Use
```bash
npx kill-port 3000
npx kill-port 3001
```

### Database Connection Failed
- Check if your IP is whitelisted in Supabase
- Verify connection string includes `?pgbouncer=true`

### Redis Connection Failed
- Verify Redis URL is correct
- Check if Upstash database is active

## What's Next?

- Read [ARCHITECTURE.md](./ARCHITECTURE.md) to understand the system
- Check [SECURITY.md](./SECURITY.md) for security features
- See [MODULE_1_COMPLETION.md](./MODULE_1_COMPLETION.md) for what's implemented

## Available Scripts

```bash
npm run dev          # Start all services
npm run build        # Build all apps
npm run test         # Run all tests
npm run db:studio    # Open database GUI
npm run db:migrate   # Run migrations
```

## Project Structure

```
neuronhire/
├── apps/
│   ├── web/         # Next.js frontend (port 3000)
│   └── api/         # Fastify backend (port 3001)
└── packages/
    └── shared/      # Shared types & utilities
```

## Need Help?

1. Check the logs in your terminal
2. Verify all environment variables are set
3. Review [SETUP.md](./SETUP.md) for detailed instructions
4. Check health endpoint: http://localhost:3001/health

---

**Ready to build!** 🚀
