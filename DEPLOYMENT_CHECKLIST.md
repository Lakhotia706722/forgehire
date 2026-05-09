# NeuronHire Deployment Checklist

**Last Updated**: May 5, 2026  
**Status**: Pre-Launch

---

## PRE-DEPLOYMENT CHECKLIST

### 1. SECURITY AUDIT ✅

#### Authentication & Authorization
- [ ] All API routes have authentication middleware
- [ ] No accidentally public endpoints
- [ ] Admin routes are role-gated
- [ ] JWT tokens expire correctly (15min access, 30day refresh)
- [ ] Token rotation on suspicious activity implemented
- [ ] Device fingerprinting active

#### Input Validation
- [x] All Prisma queries use parameterized inputs
- [x] Zero raw SQL queries
- [x] All user inputs validated with Zod schemas
- [ ] XSS protection (DOMPurify frontend, xss-clean backend)
- [ ] CSRF protection (SameSite=Strict cookies, CSRF tokens)

#### Security Headers
- [x] Content Security Policy configured
- [x] HSTS enabled (1 year, includeSubDomains, preload)
- [x] X-Frame-Options: DENY
- [x] X-Content-Type-Options: nosniff
- [x] Referrer-Policy: strict-origin-when-cross-origin

#### Rate Limiting
- [x] Global rate limit: 100 req/min
- [x] Assessment endpoints: 1 attempt per session
- [x] OTP endpoints: 3 per 10 minutes
- [x] Payout endpoints: 5 per day per user
- [x] Login attempts: 5 per 15 minutes

#### Data Encryption
- [ ] AES-256 encryption for S3 files
- [ ] TLS 1.3 enforced
- [ ] HTTPS-only cookies
- [ ] Secure WebSocket connections (wss://)

#### Webhook Security
- [x] Razorpay HMAC verification implemented
- [ ] HMAC verification tested
- [x] Idempotency keys active
- [ ] Webhook endpoint rate limited

---

### 2. DPDP ACT 2023 COMPLIANCE ✅

#### Consent Management
- [x] UserConsent model created
- [ ] Marketing email opt-in UI
- [ ] Profile data for recommendations opt-in UI
- [ ] Webcam proctoring consent UI
- [ ] Public activity feed opt-in UI
- [ ] Consent withdrawal mechanism

#### Right to Delete
- [x] AccountDeletionRequest model created
- [x] POST /account/delete endpoint
- [x] Anonymize personal data within 30 days
- [x] Retain financial records (7 years)
- [ ] Scheduled job for processing deletions

#### Data Retention
- [x] Assessment recordings: 90-day deletion (BullMQ job needed)
- [x] Chat messages: 2-year retention
- [x] Financial records: 7-year retention (soft delete only)
- [ ] Scheduled jobs active

#### Privacy & Terms
- [ ] Privacy policy page created
- [ ] Terms of service page created
- [ ] Linked from signup flow
- [ ] Version tracking implemented
- [ ] User acceptance logged

---

### 3. ENVIRONMENT VARIABLES 📝

#### Required Variables
- [ ] DATABASE_URL (Supabase PostgreSQL)
- [ ] REDIS_URL (Upstash Redis)
- [ ] MONGODB_URI (MongoDB Atlas)
- [ ] TYPESENSE_API_KEY
- [ ] TYPESENSE_HOST
- [ ] JWT_SECRET
- [ ] JWT_REFRESH_SECRET
- [ ] RAZORPAY_KEY_ID
- [ ] RAZORPAY_KEY_SECRET
- [ ] RAZORPAY_WEBHOOK_SECRET
- [ ] RAZORPAY_ACCOUNT_NUMBER
- [ ] AWS_ACCESS_KEY_ID
- [ ] AWS_SECRET_ACCESS_KEY
- [ ] AWS_REGION
- [ ] AWS_S3_BUCKET
- [ ] ANTHROPIC_API_KEY
- [ ] OPENAI_API_KEY
- [ ] DIGIO_API_KEY
- [ ] CLEARTAX_API_KEY
- [ ] COMPANY_GSTIN
- [ ] SENTRY_DSN
- [ ] PAGERDUTY_ROUTING_KEY
- [ ] CLERK_SECRET_KEY (if using Clerk)
- [ ] NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

#### Documented
- [x] .env.example created
- [ ] All variables documented
- [ ] No secrets in code
- [ ] Secrets rotation policy defined

---

### 4. DATABASE 🗄️

#### Migrations
- [x] All migrations created
- [ ] Migrations tested on staging
- [ ] Migrations are idempotent
- [ ] Rollback scripts prepared
- [ ] Seed script for dev/staging

#### Supabase RLS Policies
- [ ] Engineers can only read/write their own data
- [ ] Companies can only access their own contracts/tasks
- [ ] Admin-only routes verified
- [ ] Cross-user data access blocked

#### Indexes
- [x] All foreign keys indexed
- [x] Frequently queried fields indexed
- [ ] Query performance tested

---

### 5. FILE STORAGE (S3) 📁

#### Security
- [ ] Bucket policies block public access
- [ ] Pre-signed URLs only (15-minute expiry)
- [ ] File type validation
- [ ] File size limits enforced (50MB)
- [ ] Virus scanning (ClamAV) configured

#### Validation
- [x] MIME type checking implemented
- [x] File extension whitelist
- [ ] Content-Type validation
- [ ] Magic number verification

---

### 6. TESTING 🧪

#### Unit Tests
- [ ] 80%+ code coverage
- [ ] All service files tested
- [ ] Fee calculation tests
- [ ] HMAC verification tests
- [ ] Auto-approve logic tests

#### Integration Tests
- [x] Payment flow test created
- [ ] Engineer onboarding flow
- [ ] Company onboarding flow
- [ ] Bounty lifecycle flow
- [ ] Marketplace lifecycle flow
- [ ] Contract lifecycle flow

#### Load Tests
- [ ] 500 concurrent assessment sessions
- [ ] Socket.io proctoring under load
- [ ] API rate limit testing

#### Security Tests
- [ ] Cross-user data access blocked
- [ ] JWT validation tested
- [ ] CSRF protection tested
- [ ] XSS prevention tested

---

### 7. CI/CD PIPELINE 🚀

#### GitHub Actions
- [x] CI workflow created
- [ ] Lint on every PR
- [ ] Type check on every PR
- [ ] Unit tests on every PR
- [ ] Integration tests on merge to dev
- [ ] Deploy to staging on merge to dev
- [ ] Manual approval gate for production
- [ ] Deploy to production on merge to main
- [ ] Smoke tests after deployment

#### Deployment Targets
- [ ] Staging: Railway (API) + Vercel (Web)
- [ ] Production: AWS ECS Fargate (API) + Vercel (Web)

---

### 8. MONITORING 📊

#### Error Tracking
- [ ] Sentry configured (frontend)
- [ ] Sentry configured (backend)
- [ ] Alert on new error types
- [ ] Error grouping configured

#### Performance Monitoring
- [ ] Upstash Redis monitoring
- [ ] Alert at 80% memory capacity
- [ ] Database query performance monitoring

#### Health Checks
- [x] /health endpoint created
- [x] /health/detailed endpoint created
- [x] /health/ready endpoint (Kubernetes)
- [x] /health/live endpoint (Kubernetes)
- [ ] 60-second health checks active
- [ ] PagerDuty alerts configured

#### Logging
- [ ] Structured logging implemented
- [ ] Security events logged
- [ ] Admin actions logged
- [ ] Failed login attempts logged
- [ ] Log retention: 1 year

---

### 9. CLOUDFLARE WAF 🛡️

#### WAF Rules
- [ ] SQL injection protection
- [ ] XSS protection
- [ ] Rate limiting at edge
- [ ] Bot protection
- [ ] DDoS mitigation
- [ ] Geo-blocking (if needed)

---

### 10. PWA SETUP 📱

#### Progressive Web App
- [ ] next-pwa installed
- [ ] Service worker configured
- [ ] manifest.json created
- [ ] Install prompt for Android/iOS
- [ ] Offline fallback page

#### Push Notifications
- [ ] Web Push API configured
- [ ] New bounty match notifications
- [ ] New message notifications
- [ ] Payment released notifications
- [ ] VAPID keys generated

---

### 11. DOCUMENTATION 📚

#### Developer Documentation
- [x] README with local setup instructions
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Architecture documentation
- [ ] Database schema documentation
- [ ] Deployment guide

#### User Documentation
- [ ] User guide
- [ ] FAQ page
- [ ] Help center
- [ ] Video tutorials

---

### 12. LEGAL & COMPLIANCE ⚖️

#### Pages Required
- [ ] Privacy Policy
- [ ] Terms of Service
- [ ] Cookie Policy
- [ ] Refund Policy
- [ ] DPDP Act 2023 compliance statement

#### Consent Flows
- [ ] Signup consent checkboxes
- [ ] Cookie consent banner
- [ ] Proctoring consent modal
- [ ] Data processing consent

---

### 13. PERFORMANCE OPTIMIZATION ⚡

#### Frontend
- [ ] Code splitting
- [ ] Image optimization (Next.js Image)
- [ ] Lazy loading
- [ ] Bundle size < 200KB (gzipped)
- [ ] Lighthouse score > 90

#### Backend
- [ ] Database query optimization
- [ ] Redis caching strategy
- [ ] API response compression
- [ ] Connection pooling

---

### 14. BACKUP & DISASTER RECOVERY 💾

#### Backups
- [ ] Database daily backups (Supabase)
- [ ] S3 versioning enabled
- [ ] Redis persistence configured
- [ ] Backup restoration tested

#### Disaster Recovery
- [ ] Recovery Time Objective (RTO): 4 hours
- [ ] Recovery Point Objective (RPO): 24 hours
- [ ] Disaster recovery plan documented
- [ ] Failover tested

---

### 15. FINAL CHECKS ✔️

#### Pre-Launch
- [ ] All critical bugs fixed
- [ ] All security vulnerabilities patched
- [ ] All tests passing
- [ ] Staging environment tested
- [ ] Load testing completed
- [ ] Security audit completed
- [ ] Legal review completed
- [ ] Marketing materials ready

#### Launch Day
- [ ] DNS configured
- [ ] SSL certificates installed
- [ ] CDN configured (Cloudflare)
- [ ] Monitoring dashboards ready
- [ ] Support team briefed
- [ ] Rollback plan ready

#### Post-Launch
- [ ] Monitor error rates
- [ ] Monitor performance metrics
- [ ] Monitor user feedback
- [ ] Hot-fix process ready
- [ ] Incident response plan active

---

## DEPLOYMENT COMMANDS

### Staging Deployment
```bash
# Deploy API to Railway
railway up --service neuronhire-api-staging

# Deploy Web to Vercel
vercel --prod --scope neuronhire --token $VERCEL_TOKEN
```

### Production Deployment
```bash
# Build API
npm run build --workspace=apps/api

# Deploy to AWS ECS
aws ecs update-service --cluster neuronhire-production --service neuronhire-api --force-new-deployment

# Deploy Web to Vercel
vercel --prod --scope neuronhire --token $VERCEL_TOKEN
```

### Database Migration
```bash
# Run migrations
npx prisma migrate deploy --schema=./apps/api/prisma/schema.prisma

# Verify migration
npx prisma migrate status
```

### Rollback
```bash
# Rollback ECS deployment
aws ecs update-service --cluster neuronhire-production --service neuronhire-api --task-definition neuronhire-api:PREVIOUS_VERSION

# Rollback Vercel deployment
vercel rollback
```

---

## MONITORING URLS

- **Sentry**: https://sentry.io/organizations/neuronhire
- **Upstash**: https://console.upstash.com
- **Vercel**: https://vercel.com/neuronhire
- **AWS Console**: https://console.aws.amazon.com
- **PagerDuty**: https://neuronhire.pagerduty.com
- **Cloudflare**: https://dash.cloudflare.com

---

## SUPPORT CONTACTS

- **DevOps Lead**: devops@neuronhire.com
- **Security Team**: security@neuronhire.com
- **On-Call Engineer**: +91-XXXX-XXXXXX
- **PagerDuty**: Automatic escalation

---

**Status**: 45% Complete  
**Estimated Launch Date**: TBD  
**Blocker Items**: 
1. Complete security audit
2. Implement DPDP compliance UI
3. Complete test coverage
4. Set up monitoring

---

**Next Steps**:
1. Complete authentication middleware
2. Implement Supabase RLS policies
3. Add security headers to Next.js
4. Complete unit test coverage
5. Set up Sentry monitoring
