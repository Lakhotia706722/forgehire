# NeuronHire Setup Guide

## Prerequisites

- Node.js 18+ and npm 9+
- PostgreSQL database (Supabase recommended)
- Redis instance (Upstash recommended)
- Clerk account for authentication

## Step 1: Clone and Install

```bash
# Install dependencies
npm install

# Build shared package
cd packages/shared
npm run build
cd ../..
```

## Step 2: Set Up Supabase (PostgreSQL)

1. Create a Supabase project at https://supabase.com
2. Go to Project Settings > Database
3. Copy the connection string (use "Connection Pooling" mode with PgBouncer)
4. Your DATABASE_URL should look like:
   ```
   postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres?pgbouncer=true&connection_limit=10
   ```

## Step 3: Set Up Upstash (Redis)

1. Create an Upstash account at https://upstash.com
2. Create a new Redis database
3. Copy the Redis URL from the dashboard
4. Your REDIS_URL should look like:
   ```
   redis://default:[PASSWORD]@[ENDPOINT].upstash.io:6379
   ```

## Step 4: Set Up Clerk (Authentication)

1. Create a Clerk account at https://clerk.com
2. Create a new application
3. Enable Email OTP and Google OAuth in the authentication settings
4. Add custom metadata fields:
   - Go to Users & Authentication > User & Organization
   - Add public metadata field: `role` (string)
5. Copy your API keys:
   - `CLERK_SECRET_KEY` (starts with sk_)
   - `CLERK_PUBLISHABLE_KEY` (starts with pk_)

## Step 5: Configure Environment Variables

### Backend (apps/api/.env)
```bash
cp apps/api/.env.example apps/api/.env
```

Edit `apps/api/.env` with your values:
```env
DATABASE_URL="your-supabase-connection-string"
REDIS_URL="your-upstash-redis-url"
CLERK_SECRET_KEY="sk_test_xxxxx"
CLERK_PUBLISHABLE_KEY="pk_test_xxxxx"
JWT_SECRET="generate-a-random-32-character-string"
NODE_ENV="development"
PORT="3001"
HOST="0.0.0.0"
ALLOWED_ORIGINS="http://localhost:3000"
RATE_LIMIT_MAX="100"
RATE_LIMIT_WINDOW="60000"
OTP_RATE_LIMIT_MAX="3"
OTP_RATE_LIMIT_WINDOW="600000"
```

### Frontend (apps/web/.env.local)
```bash
cp apps/web/.env.example apps/web/.env.local
```

Edit `apps/web/.env.local`:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_xxxxx"
CLERK_SECRET_KEY="sk_test_xxxxx"
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Step 6: Set Up Database Schema

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Or run migrations (recommended for production)
npm run db:migrate
```

## Step 7: Start Development Servers

```bash
# Start all services (frontend + backend)
npm run dev
```

Or start individually:

```bash
# Terminal 1 - Backend API
cd apps/api
npm run dev

# Terminal 2 - Frontend
cd apps/web
npm run dev
```

## Step 8: Verify Setup

1. **Health Check**: Visit http://localhost:3001/health
   - Should show database and Redis as "connected"

2. **Frontend**: Visit http://localhost:3000
   - Should see the landing page

3. **Sign Up**: Click "Get Started" and test the signup flow

## Testing

```bash
# Run all tests
npm run test

# Run API tests only
cd apps/api
npm run test

# Run tests in watch mode
npm run test:watch
```

## Database Management

```bash
# Open Prisma Studio (GUI for database)
npm run db:studio

# Create a new migration
cd apps/api
npx prisma migrate dev --name your_migration_name

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

## Troubleshooting

### Database Connection Issues
- Ensure your IP is whitelisted in Supabase
- Verify the connection string includes `?pgbouncer=true`
- Check if the database is active

### Redis Connection Issues
- Verify the Redis URL is correct
- Check if Upstash database is active
- Ensure no firewall is blocking the connection

### Clerk Authentication Issues
- Verify API keys are correct
- Check if the application is active in Clerk dashboard
- Ensure allowed origins include your frontend URL

### Port Already in Use
```bash
# Kill process on port 3001 (API)
npx kill-port 3001

# Kill process on port 3000 (Frontend)
npx kill-port 3000
```

## Production Deployment

### Environment Variables
- Set `NODE_ENV=production`
- Use strong JWT_SECRET (32+ characters)
- Update ALLOWED_ORIGINS to your production domain
- Enable TLS/HTTPS

### Database
- Run migrations instead of db:push
- Enable connection pooling
- Set up backups

### Security
- All security headers are pre-configured
- CSRF protection is enabled
- Rate limiting is active
- Ensure HTTPS is enforced

## Next Steps

After setup, you can:
1. Create engineer and company profiles
2. Add skills to engineer profiles
3. Implement job posting features (Module 2)
4. Add search and filtering (Module 3)
5. Implement messaging (Module 4)

## Support

For issues or questions:
- Check the logs in the terminal
- Review the error messages
- Verify all environment variables are set correctly
