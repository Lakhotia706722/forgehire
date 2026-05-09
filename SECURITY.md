# Security Guidelines

## Overview

NeuronHire implements enterprise-grade security measures to protect user data and prevent common vulnerabilities.

## Authentication & Authorization

### Multi-Factor Authentication
- Email OTP verification required for signup
- Google OAuth as alternative
- Session management via Clerk
- JWT tokens for API authentication

### Token Management
- **Access Tokens**: 15-minute expiry
- **Refresh Tokens**: 30-day expiry
- Tokens stored securely in database
- Automatic token rotation on refresh
- Old refresh tokens deleted after use

### Role-Based Access Control (RBAC)
- Three roles: `engineer`, `company`, `admin`
- Middleware enforcement on all protected routes
- Role checked on every request
- Unauthorized access returns 403

## Rate Limiting

### Global Rate Limits
- 100 requests per minute per IP
- Applied to all API routes
- Redis-backed for distributed systems
- Returns 429 with Retry-After header

### OTP Rate Limiting
- Maximum 3 OTP requests per 10 minutes per email
- Prevents brute force attacks
- Tracked in Redis with TTL
- Clear error messages to users

### User-Specific Rate Limits
- Per-user rate limits on sensitive operations
- Configurable limits per endpoint
- Prevents abuse from authenticated users

## Input Validation

### Zod Validation
- All inputs validated before processing
- Type-safe validation schemas
- Detailed error messages
- Prevents injection attacks

### Sanitization
- No raw SQL queries (Prisma ORM only)
- Parameterized queries prevent SQL injection
- Input length limits enforced
- Special characters handled safely

## Security Headers

### Content Security Policy (CSP)
```
default-src 'self'
script-src 'self'
style-src 'self' 'unsafe-inline'
img-src 'self' data: https:
connect-src 'self'
font-src 'self'
object-src 'none'
media-src 'self'
frame-src 'none'
```

### HTTP Strict Transport Security (HSTS)
- Max age: 1 year
- Include subdomains
- Preload enabled

### Other Headers
- `X-Frame-Options: DENY` - Prevents clickjacking
- `X-Content-Type-Options: nosniff` - Prevents MIME sniffing
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` - Restricts browser features

## Cookie Security

### Configuration
- `httpOnly: true` - Prevents JavaScript access
- `secure: true` - HTTPS only (production)
- `sameSite: 'strict'` - CSRF protection
- Signed cookies with secret key

### CSRF Protection
- CSRF tokens on all state-changing operations
- Token validation on POST/PUT/DELETE requests
- Automatic token generation and validation

## Data Protection

### Sensitive Data
- Passwords never stored (Clerk handles auth)
- Passwords never logged
- JWT secrets stored in environment variables
- Database credentials in environment variables

### Logging
- No sensitive data in logs
- Error messages sanitized
- Stack traces only in development
- Request IDs for tracing

### Database Security
- Connection pooling via PgBouncer
- Encrypted connections (TLS)
- No raw SQL queries
- Cascade deletes for data integrity
- UUID v4 for IDs (prevents enumeration)

## API Security

### Request Validation
- Content-Type validation
- Request size limits
- JSON parsing with error handling
- Query parameter validation

### Response Security
- Consistent response format
- No sensitive data in error messages
- Appropriate HTTP status codes
- CORS configured for allowed origins

## Environment Variables

### Required Security Variables
```env
JWT_SECRET=minimum-32-characters-random-string
CLERK_SECRET_KEY=sk_xxx
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
```

### Validation
- All environment variables validated at startup
- Application exits if validation fails
- Type-safe access to environment variables
- No default values for secrets

## Dependency Security

### Best Practices
- Regular dependency updates
- Automated security scanning (recommended)
- No dependencies with known vulnerabilities
- Minimal dependency footprint

### Trusted Packages
- Fastify (web framework)
- Prisma (ORM)
- Clerk (authentication)
- Zod (validation)
- All from reputable sources

## Database Security

### Connection Security
- TLS encryption enforced
- Connection pooling limits
- Timeout configurations
- Automatic reconnection

### Query Security
- Prisma ORM prevents SQL injection
- No raw SQL queries
- Parameterized queries only
- Input validation before queries

### Data Integrity
- Foreign key constraints
- Cascade deletes
- Unique constraints
- Not null constraints where appropriate

## Redis Security

### Connection Security
- TLS encryption (production)
- Password authentication
- Connection retry logic
- Error handling

### Data Security
- TTL on sensitive data
- No permanent storage of secrets
- Automatic expiration
- Namespace isolation

## Monitoring & Auditing

### Health Checks
- Database connectivity monitoring
- Redis connectivity monitoring
- Service uptime tracking
- Automatic alerts (recommended)

### Logging
- Request logging with IDs
- Error logging with context
- Rate limit violations logged
- Authentication failures logged

## Incident Response

### Security Incidents
1. Identify the issue
2. Contain the breach
3. Investigate the cause
4. Notify affected users
5. Implement fixes
6. Document the incident

### Data Breach Protocol
1. Immediately revoke compromised tokens
2. Force password resets if needed
3. Notify users within 72 hours
4. Report to authorities if required
5. Implement additional security measures

## Production Checklist

### Before Deployment
- [ ] All environment variables set
- [ ] JWT_SECRET is strong (32+ characters)
- [ ] HTTPS/TLS enabled
- [ ] CORS configured for production domain
- [ ] Rate limits configured appropriately
- [ ] Database backups enabled
- [ ] Monitoring and alerts set up
- [ ] Security headers verified
- [ ] Dependencies updated
- [ ] Tests passing

### After Deployment
- [ ] Health checks passing
- [ ] Authentication working
- [ ] Rate limiting active
- [ ] Logs being collected
- [ ] Monitoring active
- [ ] Backups running
- [ ] SSL certificate valid

## Security Updates

### Regular Tasks
- Update dependencies monthly
- Review security advisories
- Rotate JWT secrets quarterly
- Review access logs weekly
- Test backup restoration monthly
- Security audit annually

## Reporting Security Issues

If you discover a security vulnerability:
1. Do NOT open a public issue
2. Email security@neuronhire.com (set this up)
3. Include detailed description
4. Provide steps to reproduce
5. Wait for acknowledgment before disclosure

## Compliance

### Data Protection
- GDPR considerations for EU users
- Data retention policies
- Right to deletion
- Data export capabilities

### Industry Standards
- OWASP Top 10 protections
- CWE/SANS Top 25 mitigations
- Secure coding practices
- Regular security assessments

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Clerk Security](https://clerk.com/docs/security)
- [Fastify Security](https://www.fastify.io/docs/latest/Guides/Security/)
- [Prisma Security](https://www.prisma.io/docs/guides/security)
