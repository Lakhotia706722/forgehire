# Module 2: API Reference

## Engineer Profile Endpoints

### Profile Management

#### Get Full Profile
```http
GET /api/engineer/profile
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "fullName": "John Doe",
    "bio": "AI Engineer specializing in NLP",
    "skills": [...],
    "projects": [...],
    "experiences": [...],
    "completeness": {
      "score": 85,
      "missingFields": [],
      "canAccessAssessment": true
    }
  }
}
```

#### Update Basic Info (Step 1)
```http
POST /api/engineer/profile/basic-info
Authorization: Bearer {token}
Content-Type: application/json

{
  "fullName": "John Doe",
  "bio": "AI Engineer with 5 years experience",
  "location": "Mumbai, India",
  "githubUrl": "https://github.com/johndoe",
  "linkedinUrl": "https://linkedin.com/in/johndoe",
  "portfolioUrl": "https://johndoe.dev",
  "yearsOfExperience": 5
}
```

### Skills (Step 2)

#### Add Skill
```http
POST /api/engineer/profile/skills
Authorization: Bearer {token}
Content-Type: application/json

{
  "skillName": "Python",
  "proficiencyLevel": "expert",
  "yearsOfExperience": 5,
  "projectCount": 10,
  "verified": false
}
```

#### Update Skill
```http
PUT /api/engineer/profile/skills/{skillId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "proficiencyLevel": "expert",
  "projectCount": 12
}
```

#### Delete Skill
```http
DELETE /api/engineer/profile/skills/{skillId}
Authorization: Bearer {token}
```

### Experience (Step 3)

#### Add Experience
```http
POST /api/engineer/profile/experiences
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Senior AI Engineer",
  "company": "Tech Corp",
  "location": "Bangalore, India",
  "startDate": "2020-01-01T00:00:00Z",
  "endDate": "2023-12-31T00:00:00Z",
  "current": false,
  "description": "Led AI initiatives...",
  "achievements": [
    "Built chatbot serving 1M users",
    "Reduced inference time by 40%"
  ]
}
```

### Projects (Step 4)

#### Add Project
```http
POST /api/engineer/profile/projects
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "AI Chatbot Platform",
  "description": "Enterprise chatbot platform with NLP capabilities",
  "problemSolved": "Automated customer support reducing response time by 80%",
  "techStack": ["Python", "TensorFlow", "FastAPI", "React"],
  "demoUrl": "https://demo.example.com",
  "githubUrl": "https://github.com/user/project",
  "screenshots": [
    "https://s3.amazonaws.com/bucket/screenshot1.png"
  ],
  "performanceMetrics": {
    "accuracy": 0.95,
    "responseTime": "200ms",
    "usersServed": 100000
  },
  "aiModelUsed": "GPT-4",
  "architectureType": "Microservices",
  "featured": true
}
```

### Pricing (Step 5)

#### Update Pricing
```http
POST /api/engineer/profile/pricing
Authorization: Bearer {token}
Content-Type: application/json

{
  "hourlyRate": 75,
  "minHourlyRate": 50,
  "maxHourlyRate": 100
}
```

### Payment (Step 6)

#### Update Payment Details
```http
POST /api/engineer/profile/payment
Authorization: Bearer {token}
Content-Type: application/json

{
  "upiId": "johndoe@paytm"
}
```

### Availability

#### Update Availability Status
```http
POST /api/engineer/profile/availability
Authorization: Bearer {token}
Content-Type: application/json

{
  "availabilityStatus": "available_in_weeks",
  "availableInWeeks": 2
}
```

**Status Options:**
- `available_now`
- `available_in_weeks` (requires `availableInWeeks` field)
- `not_available`

### Profile Insights

#### Get Completeness
```http
GET /api/engineer/profile/completeness
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "score": 75,
    "missingFields": ["Payment Details", "KYC Verification"],
    "suggestions": [
      "Add your UPI ID to enable seamless payments",
      "Complete KYC verification to build trust"
    ],
    "canAccessAssessment": true
  }
}
```

#### Get Builder Progress
```http
GET /api/engineer/profile/builder-progress
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "steps": [
      { "name": "Basic Info", "completed": true },
      { "name": "Skills", "completed": true },
      { "name": "Experience", "completed": true },
      { "name": "Projects", "completed": true },
      { "name": "Pricing", "completed": true },
      { "name": "Payment", "completed": false },
      { "name": "KYC", "completed": false }
    ],
    "completedSteps": 5,
    "totalSteps": 7,
    "completenessScore": 75,
    "canAccessAssessment": true
  }
}
```

#### Get AI Suggestions
```http
GET /api/engineer/profile/ai-suggestions
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "suggestions": [
      "Add your UPI ID to enable seamless payments from companies",
      "Complete KYC verification to unlock premium opportunities",
      "Add one more project to showcase your diverse skill set"
    ]
  }
}
```

### File Upload

#### Upload Screenshot
```http
POST /api/engineer/profile/upload-screenshot
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: [binary data]
```

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://s3.amazonaws.com/bucket/screenshots/uuid-filename.png"
  }
}
```

#### Get Presigned URL
```http
POST /api/engineer/profile/presigned-url
Authorization: Bearer {token}
Content-Type: application/json

{
  "filename": "screenshot.png",
  "contentType": "image/png"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://s3.amazonaws.com/...",
    "key": "project-screenshots/uuid-screenshot.png"
  }
}
```

## Company Profile Endpoints

### Profile Management

#### Get Profile
```http
GET /api/company/profile
Authorization: Bearer {token}
```

#### Update Profile
```http
POST /api/company/profile
Authorization: Bearer {token}
Content-Type: application/json

{
  "companyName": "Tech Corp",
  "description": "Leading AI company in India",
  "website": "https://techcorp.com",
  "logoUrl": "https://s3.amazonaws.com/bucket/logo.png",
  "location": "Bangalore, India",
  "size": "50-200",
  "industry": "Technology",
  "foundedYear": 2015,
  "gstNumber": "29ABCDE1234F1Z5"
}
```

#### Update Hiring Status
```http
POST /api/company/profile/hiring
Authorization: Bearer {token}
Content-Type: application/json

{
  "isHiring": true,
  "hiringIntents": ["full_time", "freelance", "project"],
  "aiRequirements": ["chatbots", "automation", "nlp"]
}
```

**Hiring Intents:**
- `full_time`
- `freelance`
- `project`
- `bounty`

**AI Requirements:**
- `chatbots`
- `automation`
- `agents`
- `data`
- `vision`
- `nlp`
- `mlops`

#### Calculate Trust Score
```http
POST /api/company/profile/calculate-trust-score
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "trustScore": 85
  }
}
```

**Trust Score Components:**
- Website verified: 20 points
- GST verified: 20 points
- Account age: 20 points (2 per month, max 20)
- Profile completeness: 20 points
- Hiring activity: 20 points

## Search Endpoints

### Search Engineers

```http
GET /api/search/engineers?skills=Python,TensorFlow&minNeuronScore=80&availabilityStatus=available_now&limit=20
Authorization: Bearer {token}
```

**Query Parameters:**
- `skills` - Array of skill names (comma-separated)
- `minNeuronScore` - Minimum NeuronScore (0-100)
- `maxNeuronScore` - Maximum NeuronScore (0-100)
- `availabilityStatus` - `available_now` | `available_in_weeks` | `not_available`
- `minHourlyRate` - Minimum hourly rate
- `maxHourlyRate` - Maximum hourly rate
- `location` - Location string
- `neuronTier` - `elite` | `professional` | `verified` | `conditional`
- `query` - Full-text search query
- `cursor` - Pagination cursor
- `limit` - Results per page (default: 20, max: 100)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "fullName": "John Doe",
      "skills": ["Python", "TensorFlow"],
      "neuronScore": 85,
      "neuronTier": "professional",
      "availabilityStatus": "available_now",
      "hourlyRate": 75,
      "location": "Mumbai, India"
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3
    },
    "nextCursor": "2"
  }
}
```

### Search Companies

```http
GET /api/search/companies?industry=Technology&isHiring=true&minTrustScore=70&limit=20
Authorization: Bearer {token}
```

**Query Parameters:**
- `industry` - Industry name
- `isHiring` - Boolean (true/false)
- `minTrustScore` - Minimum trust score (0-100)
- `query` - Full-text search query
- `cursor` - Pagination cursor
- `limit` - Results per page (default: 20, max: 100)

### Get Facets

#### Engineer Facets
```http
GET /api/search/engineers/facets
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "facets": [
      {
        "field_name": "skills",
        "counts": [
          { "value": "Python", "count": 150 },
          { "value": "TensorFlow", "count": 120 }
        ]
      },
      {
        "field_name": "neuronTier",
        "counts": [
          { "value": "professional", "count": 80 },
          { "value": "verified", "count": 60 }
        ]
      }
    ]
  }
}
```

## Build in Public Endpoints

### Post Activity

```http
POST /api/build-in-public/activities
Authorization: Bearer {token}
Content-Type: application/json

{
  "content": "Just shipped a new feature for my AI chatbot! 🚀 Reduced response time by 40% using caching."
}
```

### Get My Activities

```http
GET /api/build-in-public/activities/me?limit=20&skip=0
Authorization: Bearer {token}
```

### Get Engineer Activities

```http
GET /api/build-in-public/activities/engineer/{engineerProfileId}?limit=20&skip=0
Authorization: Bearer {token}
```

### Get Activity Feed

```http
GET /api/build-in-public/activities/feed?limit=50&skip=0
Authorization: Bearer {token}
```

### Delete Activity

```http
DELETE /api/build-in-public/activities/{activityId}
Authorization: Bearer {token}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "skillName",
        "message": "Skill name is required"
      }
    ]
  },
  "meta": {
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

**Common Error Codes:**
- `VALIDATION_ERROR` (400)
- `AUTHENTICATION_ERROR` (401)
- `AUTHORIZATION_ERROR` (403)
- `NOT_FOUND` (404)
- `RATE_LIMIT_EXCEEDED` (429)
- `INTERNAL_ERROR` (500)

## Rate Limits

- **Global**: 100 requests per minute per IP
- **Per-User**: Configurable per endpoint
- **OTP**: 3 attempts per 10 minutes

## Authentication

All endpoints require Bearer token authentication:

```http
Authorization: Bearer {accessToken}
```

Tokens expire after 15 minutes. Use the refresh token endpoint to get a new access token.

## Pagination

### Cursor-Based Pagination

Most list endpoints support cursor-based pagination:

```http
GET /api/search/engineers?limit=20&cursor=2
```

**Response includes:**
- `nextCursor`: Use this value for the next page
- `pagination.page`: Current page number
- `pagination.total`: Total number of results
- `pagination.totalPages`: Total number of pages

### Offset-Based Pagination

Build in Public endpoints use offset-based pagination:

```http
GET /api/build-in-public/activities/feed?limit=50&skip=100
```

## File Upload

### Direct Upload

```http
POST /api/engineer/profile/upload-screenshot
Content-Type: multipart/form-data

file: [binary data]
```

### Presigned URL (Recommended)

1. Get presigned URL:
```http
POST /api/engineer/profile/presigned-url
{
  "filename": "screenshot.png",
  "contentType": "image/png"
}
```

2. Upload directly to S3:
```http
PUT {presignedUrl}
Content-Type: image/png

[binary data]
```

3. Use the returned key in your profile data.

## NeuronScore Tiers

| Tier | Score Range | Color | Badge |
|------|-------------|-------|-------|
| Elite | 90-100 | Gold | 🥇 |
| Professional | 75-89 | Blue | 💼 |
| Verified | 60-74 | Teal | ✓ |
| Conditional | 0-59 | Gray | ⏳ |

## Profile Completeness Weights

| Section | Weight | Minimum Required |
|---------|--------|------------------|
| Basic Info | 15% | Name, bio |
| Skills | 20% | 3 skills |
| Experience | 15% | 1 experience |
| Projects | 25% | 2 projects |
| Pricing | 10% | Hourly rate |
| Payment | 5% | UPI ID |
| KYC | 10% | Verification |

**Total Required for Assessment**: 70%

---

For more details, see [MODULE_2_COMPLETION.md](./MODULE_2_COMPLETION.md)
