# NeuronHire Architecture

## Overview

NeuronHire is built as a monorepo using a modern, scalable architecture designed for an AI talent marketplace.

## Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (to be added)
- **Authentication**: Clerk (React SDK)
- **HTTP Client**: Axios with interceptors

### Backend
- **Framework**: Fastify
- **Language**: TypeScript
- **ORM**: Prisma
- **Database**: PostgreSQL (Supabase)
- **Cache**: Redis (Upstash)
- **Authentication**: Clerk + JWT

### Shared
- **Validation**: Zod
- **Types**: Shared TypeScript types
- **Utilities**: Common utilities and error classes

## Project Structure

```
neuronhire/
├── apps/
│   ├── web/                    # Next.js frontend
│   │   ├── src/
│   │   │   ├── app/           # App router pages
│   │   │   ├── components/    # React components
│   │   │   ├── lib/           # Utilities (API client)
│   │   │   └── middleware.ts  # Clerk middleware
│   │   └── package.json
│   │
│   └── api/                    # Fastify backend
│       ├── src/
│       │   ├── config/        # Configuration (env, db, redis)
│       │   ├── middleware/    # Auth, rate limiting, errors
│       │   ├── routes/        # API routes
│       │   ├── services/      # Business logic
│       │   ├── __tests__/     # Unit tests
│       │   └── index.ts       # Server entry point
│       ├── prisma/
│       │   └── schema.prisma  # Database schema
│       └── package.json
│
├── packages/
│   └── shared/                 # Shared code
│       ├── src/
│       │   ├── types/         # TypeScript types
│       │   ├── validators/    # Zod schemas
│       │   └── utils/         # Utilities
│       └── package.json
│
├── package.json               # Root package.json
└── turbo.json                # Monorepo config
```

## Database Schema

### Core Tables

#### users
- Primary user table
- Links to Clerk for authentication
- Stores role (engineer | company | admin)
- UUID v4 primary keys
- UTC timestamps

#### engineer_profiles
- One-to-one with users (role: engineer)
- Contains professional information
- Availability status
- Hourly rate

#### company_profiles
- One-to-one with users (role: company)
- Company information
- Industry and size

#### engineer_skills
- Many-to-one with engineer_profiles
- Skill name and proficiency level
- Years of experience per skill

#### refresh_tokens
- Stores JWT refresh tokens
- 30-day expiry
- Linked to users

#### otp_attempts
- Rate limiting for OTP requests
- Tracks attempts per email
- 10-minute window

## Authentication Flow

### Signup Flow
1. User submits email + role selection
2. Backend validates and checks rate limits
3. Clerk creates user account
4. OTP sent via Clerk
5. Pending signup stored in Redis (10 min TTL)

### OTP Verification
1. User submits email + OTP code
2. Backend verifies with Clerk
3. User created in database
4. JWT tokens generated (access + refresh)
5. Tokens returned to client

### Token Refresh
1. Client sends refresh token
2. Backend validates token
3. New access + refresh tokens generated
4. Old refresh token deleted

### Protected Routes
1. Client sends access token in Authorization header
2. Middleware verifies token with Clerk
3. User data attached to request
4. Role-based access control applied

## Security Features

### Authentication
- Email OTP verification
- Google OAuth
- JWT with short-lived access tokens (15 min)
- Long-lived refresh tokens (30 days)
- Clerk session management

### Authorization
- Role-based access control (RBAC)
- Middleware enforcement on all protected routes
- Three roles: engineer, company, admin

### Rate Limiting
- Global rate limit: 100 requests/minute per IP
- User-specific rate limits
- OTP rate limit: 3 attempts per 10 minutes
- Redis-backed for distributed systems

### Security Headers
- Content Security Policy (CSP)
- HTTP Strict Transport Security (HSTS)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin

### Data Protection
- Passwords never logged
- Parameterized queries only (via Prisma)
- Input validation with Zod
- CSRF protection
- SameSite cookies
- TLS enforcement in production

### Database Security
- Connection pooling via PgBouncer
- No raw SQL queries
- UUID v4 for all IDs (prevents enumeration)
- Cascade deletes for data integrity

## API Response Format

All API responses follow a consistent structure:

```typescript
{
  success: boolean;
  data?: any;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    requestId?: string;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}
```

## Error Handling

### Custom Error Classes
- `AppError`: Base error class
- `ValidationError`: Input validation failures (400)
- `AuthenticationError`: Auth failures (401)
- `AuthorizationError`: Permission denied (403)
- `NotFoundError`: Resource not found (404)
- `RateLimitError`: Rate limit exceeded (429)

### Error Handler Middleware
- Catches all errors
- Formats error responses
- Logs errors (excludes sensitive data)
- Returns appropriate HTTP status codes

## Validation

### Input Validation
- All inputs validated with Zod
- Validation happens before database queries
- Type-safe validation schemas
- Shared validators between frontend and backend

### Environment Validation
- Environment variables validated at startup
- Application exits if validation fails
- Type-safe environment access

## Caching Strategy

### Redis Usage
- Rate limiting counters
- OTP attempt tracking
- Pending signup data (TTL: 10 min)
- Session data (future)
- Cache invalidation on updates

## Testing Strategy

### Unit Tests
- Auth middleware tests
- Role check tests
- OTP flow tests
- Rate limiter tests
- Service layer tests

### Test Setup
- Jest test framework
- ts-jest for TypeScript
- Mocked dependencies
- Isolated test environment

## Performance Optimizations

### Database
- Connection pooling (PgBouncer)
- Indexed columns (email, clerkId, userId)
- Efficient queries via Prisma
- Cascade deletes

### Caching
- Redis for frequently accessed data
- Rate limit counters in memory
- Session caching

### Frontend
- Next.js App Router for optimal performance
- Server-side rendering
- Automatic code splitting
- Image optimization

## Scalability Considerations

### Horizontal Scaling
- Stateless API servers
- Redis for shared state
- Database connection pooling
- Load balancer ready

### Vertical Scaling
- Efficient database queries
- Indexed lookups
- Connection pooling
- Caching layer

## Monitoring & Health Checks

### Health Endpoints
- `/health`: Overall system health
- `/health/ready`: Readiness probe
- `/health/live`: Liveness probe

### Checks
- Database connectivity
- Redis connectivity
- Service uptime
- Response times

## Future Enhancements

### Module 2: Core Features
- Job postings
- Project listings
- Profile search
- Filtering and sorting

### Module 3: Matching
- AI-powered matching
- Skill-based recommendations
- Company-engineer matching

### Module 4: Communication
- In-app messaging
- Notifications
- Email alerts

### Module 5: Payments
- Stripe integration
- Escrow system
- Invoice generation

## Development Workflow

1. Make changes in respective apps/packages
2. Shared package changes require rebuild
3. Run tests before committing
4. Use Prisma migrations for schema changes
5. Update environment variables as needed

## Deployment

### Backend (API)
- Deploy to any Node.js hosting (Vercel, Railway, Fly.io)
- Set environment variables
- Run database migrations
- Enable health check monitoring

### Frontend (Web)
- Deploy to Vercel (recommended for Next.js)
- Set environment variables
- Configure custom domain
- Enable analytics

### Database
- Supabase (managed PostgreSQL)
- Enable backups
- Monitor connection pool
- Set up alerts

### Redis
- Upstash (managed Redis)
- Monitor memory usage
- Set up alerts
