# NeuronHire

AI-only talent and product marketplace for India's AI engineering community.

## Project Structure

```
neuronhire/
├── apps/
│   ├── web/          # Next.js 14 frontend
│   └── api/          # Fastify backend
├── packages/
│   └── shared/       # Shared types and utilities
└── turbo.json        # Monorepo configuration
```

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Node.js with Fastify, TypeScript
- **Database**: PostgreSQL via Supabase with Prisma ORM
- **Cache**: Redis via Upstash
- **Auth**: Clerk (email OTP, Google OAuth, RBAC)
- **Search**: Typesense (full-text search)
- **Storage**: AWS S3 (file uploads)
- **AI**: Anthropic Claude API (assessments, task intelligence)
- **Payments**: Razorpay (escrow, payouts)
- **Jobs**: BullMQ (async processing)
- **NoSQL**: MongoDB Atlas (activity feeds, question bank)

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env
```

3. Generate Prisma client:
```bash
npm run db:generate
```

4. Push database schema:
```bash
npm run db:push
```

5. Start development servers:
```bash
npm run dev
```

## Environment Variables

### Frontend (apps/web/.env.local)
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Backend (apps/api/.env)
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/neuronhire

# Redis
REDIS_URL=redis://localhost:6379

# MongoDB
MONGODB_URL=mongodb://localhost:27017/neuronhire

# Typesense
TYPESENSE_HOST=xxx.a1.typesense.net
TYPESENSE_PORT=443
TYPESENSE_PROTOCOL=https
TYPESENSE_API_KEY=xxxxx

# AWS S3
AWS_ACCESS_KEY_ID=xxxxx
AWS_SECRET_ACCESS_KEY=xxxxx
AWS_REGION=ap-south-1
AWS_S3_BUCKET=neuronhire-uploads

# Anthropic
ANTHROPIC_API_KEY=sk-ant-xxxxx

# Clerk
CLERK_SECRET_KEY=sk_test_xxxxx
CLERK_PUBLISHABLE_KEY=pk_test_xxxxx

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=30d

# Razorpay (Module 4)
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
RAZORPAY_ACCOUNT_NUMBER=xxxxx

# Server
NODE_ENV=development
PORT=3001
HOST=0.0.0.0
ALLOWED_ORIGINS=http://localhost:3000
```

## Scripts

- `npm run dev` - Start all development servers
- `npm run build` - Build all apps
- `npm run test` - Run all tests
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio
- `npm run worker` - Start assessment worker
- `npm run worker:task` - Start task enrichment worker
- `npm run seed:questions` - Seed question bank

## Modules

### Module 1: Foundation ✅
- Authentication with Clerk (email OTP, Google OAuth)
- RBAC (engineer | company | admin)
- Database setup with Prisma
- Redis caching
- Rate limiting
- Security headers

### Module 2: Profiles ✅
- Engineer profiles (8-step builder, 70% completeness gate)
- Company profiles (trust score, verification)
- Project portfolios with S3 uploads
- NeuronScore badges
- AI profile suggestions
- Build in Public feed
- Search with Typesense

### Module 3: Assessment & NeuronScore ✅
- AI-powered assessment generation (Claude API)
- 200+ question bank (MongoDB)
- Real-time proctoring (WebSocket)
- Docker sandbox for code evaluation
- Plagiarism detection
- PDF report generation
- NeuronScore engine (0-1000, 6 dimensions)
- Score decay mechanism
- Mini-gate tests

### Module 4: Task & Bounty System ✅
- Task creation with AI enrichment
- Escrow system (Razorpay)
- NeuronScore gate check
- NDA generation and signing
- Q&A board
- Contest mode with ranked payouts
- Submission evaluation
- Automatic payout on winner selection

## Running the Complete System

### Prerequisites
- Node.js 18+
- PostgreSQL (Supabase)
- Redis (Upstash)
- MongoDB Atlas
- Typesense Cloud
- AWS S3 bucket
- Clerk account
- Anthropic API key
- Razorpay account

### Setup Steps

1. **Install dependencies:**
```bash
npm install
```

2. **Configure environment variables:**
```bash
# Copy example files
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local

# Edit with your credentials
nano apps/api/.env
```

3. **Database setup:**
```bash
cd apps/api
npm run db:generate
npm run db:migrate
```

4. **Seed question bank (Module 3):**
```bash
npm run seed:questions
```

5. **Start services:**

Terminal 1 - API Server:
```bash
cd apps/api
npm run dev
```

Terminal 2 - Assessment Worker:
```bash
cd apps/api
npm run worker
```

Terminal 3 - Task Enrichment Worker:
```bash
cd apps/api
npm run worker:task
```

Terminal 4 - Frontend:
```bash
cd apps/web
npm run dev
```

### Access Points
- Frontend: http://localhost:3000
- API: http://localhost:3001
- Health Check: http://localhost:3001/health
- Prisma Studio: `npm run db:studio`

## Security Features

- RBAC with roles: engineer | company | admin
- Rate limiting (per-IP and per-user)
- OTP rate limiting (max 3 per 10 minutes)
- Security headers (CSP, SameSite cookies, CSRF)
- TLS enforcement
- Environment variable validation with Zod
- Database connection pooling with PgBouncer
- Escrow enforcement for task payments
- NeuronScore gating for quality control
- NDA protection for sensitive tasks
- Digital signature tracking with IP logging

## Testing

Run all tests:
```bash
npm test
```

Run specific test suites:
```bash
# Module 1 tests
npm test -- auth.test.ts

# Module 2 tests
npm test -- profile-completeness.test.ts
npm test -- search.test.ts

# Module 4 tests
npm test -- task.test.ts
npm test -- task-flow.test.ts
```

## Documentation

- [Architecture](./ARCHITECTURE.md)
- [Setup Guide](./SETUP.md)
- [Quick Start](./QUICKSTART.md)
- [Security](./SECURITY.md)
- [Module 1 Completion](./MODULE_1_COMPLETION.md)
- [Module 2 Completion](./MODULE_2_COMPLETION.md)
- [Module 2 API Reference](./MODULE_2_API_REFERENCE.md)
- [Module 3 Completion](./MODULE_3_COMPLETION.md)
- [Module 4 Completion](./MODULE_4_COMPLETION.md)
- [Module 4 API Reference](./MODULE_4_API_REFERENCE.md)
- [Project Summary](./PROJECT_SUMMARY.md)
- [Final Report](./FINAL_REPORT.md)

## License

Proprietary
