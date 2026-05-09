# Getting Started with NeuronHire

Welcome to NeuronHire! This guide will help you get the project running on your local machine.

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js 18+** and **npm 9+** installed
- **Git** for version control
- A code editor (VS Code recommended)
- Accounts on:
  - [Supabase](https://supabase.com) - PostgreSQL database
  - [Upstash](https://upstash.com) - Redis cache
  - [Clerk](https://clerk.com) - Authentication

## 🚀 Installation Steps

### Step 1: Install Dependencies

```bash
npm install
```

This will install all dependencies for the monorepo (frontend, backend, and shared packages).

### Step 2: Set Up External Services

#### A. Supabase (Database)

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be provisioned
3. Go to **Project Settings** → **Database**
4. Copy the **Connection Pooling** connection string (with PgBouncer)
5. It should look like:
   ```
   postgresql://postgres.[PROJECT]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres?pgbouncer=true
   ```

#### B. Upstash (Redis)

1. Go to [upstash.com](https://upstash.com) and create an account
2. Create a new Redis database
3. Choose a region close to your Supabase region
4. Copy the **Redis URL** from the dashboard
5. It should look like:
   ```
   redis://default:[PASSWORD]@[ENDPOINT].upstash.io:6379
   ```

#### C. Clerk (Authentication)

1. Go to [clerk.com](https://clerk.com) and create an account
2. Create a new application
3. Configure authentication methods:
   - Enable **Email** with **Email code** (OTP)
   - Enable **Google** OAuth
4. Go to **API Keys** and copy:
   - `CLERK_SECRET_KEY` (starts with `sk_test_` or `sk_live_`)
   - `CLERK_PUBLISHABLE_KEY` (starts with `pk_test_` or `pk_live_`)

### Step 3: Configure Environment Variables

#### Backend Configuration

```bash
# Copy the example file
cp apps/api/.env.example apps/api/.env

# Edit apps/api/.env with your values
```

Required variables in `apps/api/.env`:

```env
# Database (from Supabase)
DATABASE_URL="postgresql://postgres.[PROJECT]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=10"

# Redis (from Upstash)
REDIS_URL="redis://default:[PASSWORD]@[ENDPOINT].upstash.io:6379"

# Clerk (from Clerk dashboard)
CLERK_SECRET_KEY="sk_test_xxxxx"
CLERK_PUBLISHABLE_KEY="pk_test_xxxxx"

# JWT Secret (generate a random 32+ character string)
JWT_SECRET="your-super-secret-jwt-key-minimum-32-characters-long"

# Server Configuration
NODE_ENV="development"
PORT="3001"
HOST="0.0.0.0"
ALLOWED_ORIGINS="http://localhost:3000"

# Rate Limiting
RATE_LIMIT_MAX="100"
RATE_LIMIT_WINDOW="60000"
OTP_RATE_LIMIT_MAX="3"
OTP_RATE_LIMIT_WINDOW="600000"
```

#### Frontend Configuration

```bash
# Copy the example file
cp apps/web/.env.example apps/web/.env.local

# Edit apps/web/.env.local with your values
```

Required variables in `apps/web/.env.local`:

```env
# Clerk (same as backend)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_xxxxx"
CLERK_SECRET_KEY="sk_test_xxxxx"

# API URL
NEXT_PUBLIC_API_URL="http://localhost:3001"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Step 4: Set Up Database

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database (for development)
npm run db:push

# OR run migrations (recommended for production)
npm run db:migrate
```

### Step 5: Verify Setup

Run the verification script:

```bash
node verify-setup.js
```

This will check if all files and configurations are in place.

### Step 6: Start Development Servers

```bash
# Start both frontend and backend
npm run dev
```

Or start them separately:

```bash
# Terminal 1 - Backend API
cd apps/api
npm run dev

# Terminal 2 - Frontend
cd apps/web
npm run dev
```

### Step 7: Test the Application

1. **Backend Health Check**: 
   - Open http://localhost:3001/health
   - Should show database and Redis as "connected"

2. **Frontend**:
   - Open http://localhost:3000
   - Should see the landing page

3. **Sign Up Flow**:
   - Click "Get Started"
   - Choose "I'm an Engineer" or "I'm Hiring"
   - Enter your email
   - Verify OTP code
   - Complete profile

## 🧪 Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
cd apps/api
npm run test:watch

# Run tests with coverage
npm run test -- --coverage
```

## 🔧 Development Tools

### Prisma Studio (Database GUI)

```bash
npm run db:studio
```

Opens a GUI at http://localhost:5555 to view and edit database records.

### Database Migrations

```bash
# Create a new migration
cd apps/api
npx prisma migrate dev --name your_migration_name

# Apply migrations
npx prisma migrate deploy

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

## 📚 Project Structure

```
neuronhire/
├── apps/
│   ├── web/          # Next.js frontend (http://localhost:3000)
│   └── api/          # Fastify backend (http://localhost:3001)
├── packages/
│   └── shared/       # Shared types and utilities
└── [config files]
```

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Kill process on port 3000 (frontend)
npx kill-port 3000

# Kill process on port 3001 (backend)
npx kill-port 3001
```

### Database Connection Failed

- Verify your IP is whitelisted in Supabase
- Check the connection string includes `?pgbouncer=true`
- Ensure the database is active in Supabase dashboard

### Redis Connection Failed

- Verify the Redis URL is correct
- Check if the Upstash database is active
- Ensure no firewall is blocking the connection

### Clerk Authentication Issues

- Verify API keys are correct (check for typos)
- Ensure the Clerk application is active
- Check that allowed origins include `http://localhost:3000`

### Environment Variables Not Loading

- Ensure `.env` files are in the correct locations
- Restart the development servers after changing `.env` files
- Check for syntax errors in `.env` files (no quotes needed)

### Prisma Client Not Found

```bash
npm run db:generate
```

### Module Not Found Errors

```bash
# Clean and reinstall
npm run clean
rm -rf node_modules
npm install
```

## 📖 Next Steps

Now that you have the project running:

1. **Explore the Code**:
   - Read `ARCHITECTURE.md` to understand the system design
   - Check `SECURITY.md` for security best practices
   - Review the code in `apps/api/src` and `apps/web/src`

2. **Try the Features**:
   - Sign up as an engineer
   - Sign up as a company
   - Test the authentication flow
   - Check the health endpoints

3. **Read the Documentation**:
   - `README.md` - Project overview
   - `QUICKSTART.md` - Quick reference
   - `MODULE_1_COMPLETION.md` - What's implemented
   - `PROJECT_SUMMARY.md` - High-level summary

4. **Start Building**:
   - Module 2 will add profile management
   - Module 3 will add job postings
   - Module 4 will add messaging

## 🎯 Available Scripts

```bash
# Development
npm run dev          # Start all services
npm run build        # Build all apps
npm run test         # Run all tests

# Database
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:migrate   # Run migrations
npm run db:studio    # Open Prisma Studio

# Utilities
npm run clean        # Clean build artifacts
npm run lint         # Lint code
```

## 🆘 Getting Help

If you encounter issues:

1. Check the logs in your terminal
2. Review the troubleshooting section above
3. Verify all environment variables are set correctly
4. Check the health endpoint: http://localhost:3001/health
5. Review the documentation files

## 🎉 You're Ready!

Congratulations! You now have NeuronHire running locally. Start exploring the codebase and building amazing features!

---

**Happy Coding! 🚀**
