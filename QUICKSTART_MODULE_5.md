# Module 5: AI Marketplace - Quick Start Guide

## 🚀 Get Started in 5 Minutes

This guide will help you set up and test the AI Marketplace (Module 5) functionality.

---

## 📋 Prerequisites

Before starting, ensure you have:
- ✅ Modules 1-4 set up and running
- ✅ OpenAI API key (for content moderation)
- ✅ Razorpay account (for payments)

---

## ⚡ Quick Setup

### 1. Add Environment Variable

Add to `apps/api/.env`:
```env
OPENAI_API_KEY="sk-xxxxx"
```

### 2. Install Dependencies

```bash
npm install --legacy-peer-deps
```

### 3. Generate Prisma Client

```bash
cd apps/api
npm run db:generate
```

### 4. Run Migrations

```bash
npm run db:migrate
```

### 5. Start Server

```bash
npm run dev
```

---

## 🧪 Test the API

### 1. Create a Product (Engineer)

**Endpoint**: `POST /api/products`

**Headers**:
```
Authorization: Bearer <engineer-jwt-token>
Content-Type: application/json
```

**Body**:
```json
{
  "name": "AI Chatbot for E-commerce",
  "tagline": "Boost sales with intelligent customer support",
  "category": "ai_agents",
  "tags": ["chatbot", "e-commerce", "customer-support", "gpt-4"],
  "thumbnailUrl": "https://example.com/thumbnail.jpg",
  "description": "A fully customizable AI chatbot powered by GPT-4 that handles customer queries, product recommendations, and order tracking. Integrates seamlessly with Shopify, WooCommerce, and custom platforms. Reduces support costs by 70% while improving customer satisfaction.",
  "demoUrl": "https://demo.example.com",
  "screenshots": [
    "https://example.com/screenshot1.jpg",
    "https://example.com/screenshot2.jpg",
    "https://example.com/screenshot3.jpg"
  ],
  "techStack": ["GPT-4", "Python", "FastAPI", "React", "PostgreSQL"],
  "aiModelUsed": "GPT-4",
  "architectureType": "Microservices",
  "pricingModel": "subscription",
  "priceINR": 9999,
  "priceUSD": 120,
  "features": [
    {
      "title": "24/7 Availability",
      "description": "Never miss a customer query",
      "included": true
    },
    {
      "title": "Multi-language Support",
      "description": "Supports 50+ languages",
      "included": true
    },
    {
      "title": "Custom Training",
      "description": "Train on your product catalog",
      "included": true
    }
  ],
  "performanceMetrics": {
    "responseTime": "< 2 seconds",
    "accuracy": "95%",
    "uptime": "99.9%"
  },
  "deliveryType": "instant",
  "customizationAvailable": true,
  "supportType": "email",
  "supportDuration": "1year"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "AI Chatbot for E-commerce",
    "status": "draft",
    ...
  },
  "message": "Product created successfully in draft status"
}
```

### 2. Publish Product

**Endpoint**: `POST /api/products/:id/publish`

**Headers**:
```
Authorization: Bearer <engineer-jwt-token>
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "published",
    "moderationStatus": "approved",
    "publishedAt": "2026-05-04T10:00:00Z",
    ...
  },
  "message": "Product published successfully"
}
```

### 3. Search Products (Public)

**Endpoint**: `GET /api/products?category=ai_agents&limit=10`

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "AI Chatbot for E-commerce",
      "tagline": "Boost sales with intelligent customer support",
      "category": "ai_agents",
      "priceINR": 9999,
      "rating": null,
      "engineerProfile": {
        "fullName": "John Doe",
        "neuronScore": 850,
        "neuronTier": "professional"
      }
    }
  ],
  "meta": {
    "nextCursor": null,
    "hasMore": false
  }
}
```

### 4. Purchase Product (Company)

**Endpoint**: `POST /api/products/:id/purchase`

**Headers**:
```
Authorization: Bearer <company-jwt-token>
Content-Type: application/json
```

**Body**:
```json
{
  "currency": "INR",
  "referralCode": "REF12345678"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "purchaseId": "uuid",
    "orderId": "order_xxxxx",
    "amount": 9999,
    "currency": "INR",
    "licenseKey": "NH-ABCD-1234-EFGH-5678"
  },
  "message": "Purchase order created. Complete payment to get access."
}
```

### 5. Complete Purchase

**Endpoint**: `POST /api/purchases/:id/complete`

**Headers**:
```
Authorization: Bearer <company-jwt-token>
Content-Type: application/json
```

**Body**:
```json
{
  "paymentId": "pay_xxxxx",
  "signature": "signature_xxxxx"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "completed",
    "licenseKey": "NH-ABCD-1234-EFGH-5678",
    "accessGranted": true,
    "accessDetails": {
      "licenseType": "subscription",
      "grantedAt": "2026-05-04T10:00:00Z",
      "downloadUrl": "https://...",
      "accessInstructions": "..."
    }
  },
  "message": "Purchase completed successfully. Access granted!"
}
```

### 6. Create Review

**Endpoint**: `POST /api/reviews`

**Headers**:
```
Authorization: Bearer <company-jwt-token>
Content-Type: application/json
```

**Body**:
```json
{
  "purchaseId": "uuid",
  "rating": 5,
  "title": "Excellent product!",
  "review": "This AI chatbot has transformed our customer support. Response times are down by 80% and customer satisfaction is up. Highly recommended!",
  "pros": ["Easy to integrate", "Great support", "Accurate responses"],
  "cons": ["Initial setup took some time"]
}
```

### 7. Get AI Recommendations

**Endpoint**: `GET /api/recommendations?limit=5`

**Headers**:
```
Authorization: Bearer <company-jwt-token>
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "AI Chatbot for E-commerce",
      "relevanceScore": 85,
      "recommendationReason": "Matches your industry: e-commerce • Addresses your AI needs: chatbots • Built by professional engineer",
      ...
    }
  ]
}
```

### 8. Get Product Analytics (Engineer)

**Endpoint**: `GET /api/products/:id/analytics?period=month`

**Headers**:
```
Authorization: Bearer <engineer-jwt-token>
```

**Response**:
```json
{
  "success": true,
  "data": {
    "productId": "uuid",
    "productName": "AI Chatbot for E-commerce",
    "period": "month",
    "summary": {
      "totalViews": 1250,
      "totalPurchases": 15,
      "totalRevenue": 149985,
      "totalRefunds": 0,
      "conversionRate": 1.2,
      "refundRate": 0,
      "averageOrderValue": 9999
    },
    "ratingTrend": {
      "current": 4.8,
      "trend": "up",
      "change": 0.3
    },
    "topIndustries": [
      { "industry": "e-commerce", "count": 8 },
      { "industry": "retail", "count": 4 },
      { "industry": "saas", "count": 3 }
    ],
    "dailyData": [...]
  }
}
```

---

## 🎯 Key Features to Test

### 1. Product Moderation
- Try creating a product with inappropriate content
- Should be rejected with moderation notes

### 2. License Keys
- Each purchase generates unique license key
- Format: NH-XXXX-XXXX-XXXX-XXXX
- Can be revoked by engineer

### 3. Commission Calculation
- Products <₹10K → 15% commission
- Subscriptions → 20% commission
- High-value → 20% commission

### 4. Referral System
- Generate referral link: `POST /api/referrals`
- Use referral code in purchase
- 5% commission tracked

### 5. Bundles
- Create bundle with 2+ products
- Automatic discount calculation
- Bundle price must be < sum of individual prices

### 6. Subscriptions
- Create subscription after purchase
- Choose billing cycle (monthly/quarterly/yearly)
- Cancel subscription anytime

### 7. Disputes
- Raise dispute within 30 days
- Admin resolves with refund or rejection
- License revoked on refund

---

## 📊 Test Data

### Sample Product Categories
- `ai_agents` - AI Agents
- `fine_tuned_models` - Fine-Tuned Models
- `saas_tools` - SaaS Tools
- `automation_workflows` - Automation Workflows
- `datasets_prompts` - Datasets & Prompts
- `apis_microservices` - APIs & Microservices

### Sample Pricing Models
- `one_time` - One-time purchase
- `subscription` - Recurring subscription
- `freemium` - Free with paid upgrades
- `per_call` - Pay per API call

---

## 🐛 Troubleshooting

### Issue: "Product moderation failed"
**Solution**: Check OPENAI_API_KEY in .env file

### Issue: "Payment verification failed"
**Solution**: Ensure Razorpay signature is correct

### Issue: "License key already exists"
**Solution**: This is rare - retry the purchase

### Issue: "Dispute window expired"
**Solution**: Disputes must be raised within 30 days

---

## 📚 Additional Resources

- **Full Documentation**: See `MODULE_5_COMPLETION.md`
- **API Reference**: See `apps/api/src/routes/product.routes.ts`
- **Database Schema**: See `apps/api/prisma/schema.prisma`
- **Validators**: See `packages/shared/src/validators/product.ts`

---

## 🎉 Success!

You've successfully set up and tested the AI Marketplace! 

**Next Steps**:
1. Test all 31 endpoints
2. Integrate with frontend
3. Set up cron jobs for subscriptions and payouts
4. Implement email notifications
5. Write integration tests

---

**Happy Building! 🚀**
