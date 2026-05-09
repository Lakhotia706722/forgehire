# Module 4: Task & Bounty System - API Reference

## Base URL
```
http://localhost:3001/api
```

## Authentication
All endpoints (except task feed) require authentication via Clerk JWT token in the `Authorization` header:
```
Authorization: Bearer <clerk_jwt_token>
```

---

## Task Management

### 1. Create Task
Create a new task in draft state.

**Endpoint:** `POST /api/tasks`  
**Auth:** Required (Company only)

**Request Body:**
```json
{
  "title": "Build AI-Powered Chatbot for Customer Support",
  "type": "bounty",
  "category": ["AI", "NLP", "Chatbot"],
  "problemStatement": "We need an AI chatbot that can handle customer support queries...",
  "currentState": "Currently using manual support team",
  "expectedOutcome": "A production-ready chatbot with 90%+ accuracy",
  "deliverables": [
    {
      "title": "Trained AI Model",
      "description": "Fine-tuned language model",
      "acceptanceCriteria": ["90%+ accuracy", "Handles 10+ intent categories"]
    }
  ],
  "techRequirements": ["Python", "TensorFlow", "FastAPI"],
  "timeline": 30,
  "rewardAmount": 50000,
  "paymentType": "fixed",
  "currency": "INR",
  "selectionCriteria": [
    {
      "name": "Model Accuracy",
      "weight": 40,
      "description": "Accuracy on test dataset"
    }
  ],
  "minNeuronScore": 500,
  "ndaRequired": false,
  "difficulty": "hard",
  "isContest": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Build AI-Powered Chatbot...",
    "status": "draft",
    "escrowDeposited": false,
    "createdAt": "2024-01-15T10:00:00Z"
  },
  "message": "Task created successfully. AI enrichment in progress."
}
```

---

### 2. Get Task Feed
Get list of tasks with filters.

**Endpoint:** `GET /api/tasks`  
**Auth:** Optional (public endpoint)

**Query Parameters:**
```
type: bounty | direct | contest
category: AI,ML,NLP (comma-separated)
difficulty: easy | medium | hard | expert
minReward: 10000
maxReward: 100000
minNeuronScore: 400
maxNeuronScore: 800
skills: Python,TensorFlow (comma-separated)
status: open | in_progress | in_review
ndaRequired: true | false
query: search text
sortBy: createdAt | publishedAt | deadline | rewardAmount | participantCount
sortOrder: asc | desc
cursor: uuid (for pagination)
limit: 20 (default)
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Build AI Chatbot",
      "type": "bounty",
      "category": ["AI", "NLP"],
      "rewardAmount": 50000,
      "difficulty": "hard",
      "minNeuronScore": 500,
      "status": "open",
      "participantCount": 5,
      "submissionCount": 2,
      "deadline": "2024-02-15T00:00:00Z",
      "companyProfile": {
        "companyName": "Tech Corp",
        "logoUrl": "https://...",
        "trustScore": 85
      }
    }
  ],
  "meta": {
    "nextCursor": "uuid",
    "hasMore": true
  }
}
```

---

### 3. Get Task Details
Get detailed information about a specific task.

**Endpoint:** `GET /api/tasks/:id`  
**Auth:** Optional

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Build AI Chatbot",
    "type": "bounty",
    "problemStatement": "Full problem description...",
    "expectedOutcome": "Expected results...",
    "deliverables": [...],
    "techRequirements": ["Python", "TensorFlow"],
    "timeline": 30,
    "rewardAmount": 50000,
    "selectionCriteria": [...],
    "minNeuronScore": 500,
    "ndaRequired": false,
    "difficulty": "hard",
    "status": "open",
    "aiEnriched": true,
    "postingQuality": 9,
    "estimatedTimeline": 25,
    "suggestedReward": {
      "min": 40000,
      "max": 60000,
      "currency": "INR"
    },
    "autoTaggedSkills": ["Python", "TensorFlow", "FastAPI"],
    "companyProfile": {...},
    "participations": [...],
    "questions": [...]
  }
}
```

**Note:** If NDA required and not signed, sensitive details will be hidden.

---

## Escrow Management

### 4. Create Escrow Order
Create Razorpay order for escrow deposit.

**Endpoint:** `POST /api/tasks/:id/escrow/create`  
**Auth:** Required (Company only)

**Response:**
```json
{
  "success": true,
  "data": {
    "orderId": "order_xyz123",
    "amount": 50000
  },
  "message": "Escrow order created. Complete payment to publish task."
}
```

---

### 5. Deposit Escrow
Verify payment and publish task.

**Endpoint:** `POST /api/tasks/:id/escrow/deposit`  
**Auth:** Required (Company only)

**Request Body:**
```json
{
  "taskId": "uuid",
  "orderId": "order_xyz123",
  "paymentId": "pay_abc456",
  "signature": "razorpay_signature"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "open",
    "escrowDeposited": true,
    "publishedAt": "2024-01-15T10:30:00Z"
  },
  "message": "Escrow deposited successfully. Task is now live!"
}
```

---

## Participation & Submission

### 6. Participate in Task
Register intent to work on task.

**Endpoint:** `POST /api/tasks/:id/participate`  
**Auth:** Required (Engineer only)

**Request Body:**
```json
{
  "approach": "I will use GPT-based model fine-tuned on your support data. Architecture: FastAPI backend with Redis caching...",
  "estimatedTime": 25,
  "proposedRate": null
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "taskId": "uuid",
    "engineerProfileId": "uuid",
    "approach": "I will use GPT-based model...",
    "createdAt": "2024-01-15T11:00:00Z"
  },
  "message": "Successfully registered for task"
}
```

**Error (NeuronScore too low):**
```json
{
  "success": false,
  "error": "NeuronScore 400 is below minimum required 500. Take a mini-gate test to qualify."
}
```

---

### 7. Submit Work
Submit completed work for task.

**Endpoint:** `POST /api/tasks/:id/submit`  
**Auth:** Required (Engineer only)

**Request Body:**
```json
{
  "description": "Completed chatbot with 92% accuracy on test dataset...",
  "demoUrl": "https://demo.chatbot.test",
  "githubUrl": "https://github.com/engineer/chatbot",
  "codeUrl": "https://github.com/engineer/chatbot/archive/main.zip",
  "screenshots": [
    "https://s3.amazonaws.com/screenshots/chat1.png"
  ],
  "videoUrl": "https://youtube.com/demo-video",
  "performanceMetrics": {
    "accuracy": 0.92,
    "avgResponseTime": 0.8
  },
  "architectureDiagram": "https://s3.amazonaws.com/diagrams/architecture.png"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "taskId": "uuid",
    "status": "pending",
    "submittedAt": "2024-01-20T15:00:00Z"
  },
  "message": "Work submitted successfully"
}
```

---

## Evaluation & Winner Selection

### 8. Evaluate Submission
Evaluate and score a submission.

**Endpoint:** `POST /api/tasks/:id/submissions/:submissionId/evaluate`  
**Auth:** Required (Company only)

**Request Body:**
```json
{
  "submissionId": "uuid",
  "score": 92,
  "feedback": "Excellent work! Model accuracy exceeds requirements...",
  "criteriaScores": {
    "Model Accuracy": 95,
    "Response Time": 90,
    "Code Quality": 90,
    "Documentation": 92
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "score": 92,
    "status": "under_review",
    "reviewedAt": "2024-01-21T10:00:00Z"
  },
  "message": "Submission evaluated successfully"
}
```

---

### 9. Select Winner (Single)
Select winner and initiate payout.

**Endpoint:** `PUT /api/tasks/:id/winner`  
**Auth:** Required (Company only)

**Request Body:**
```json
{
  "submissionId": "uuid",
  "rank": 1
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "payoutId": "payout_xyz789"
  },
  "message": "Winner selected. Payout initiated."
}
```

---

### 10. Select Multiple Winners (Contest)
Select multiple winners with ranked payouts.

**Endpoint:** `PUT /api/tasks/:id/winners`  
**Auth:** Required (Company only)

**Request Body:**
```json
{
  "winners": [
    {
      "submissionId": "uuid1",
      "rank": 1
    },
    {
      "submissionId": "uuid2",
      "rank": 2
    },
    {
      "submissionId": "uuid3",
      "rank": 3
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "payouts": [
      {
        "payoutId": "payout_1",
        "status": "processing",
        "rank": 1
      },
      {
        "payoutId": "payout_2",
        "status": "processing",
        "rank": 2
      },
      {
        "payoutId": "payout_3",
        "status": "processing",
        "rank": 3
      }
    ]
  },
  "message": "Winners selected. Payouts initiated."
}
```

---

## Q&A Board

### 11. Ask Question
Post a question on task Q&A board.

**Endpoint:** `POST /api/tasks/:id/questions`  
**Auth:** Required (Engineer or Company)

**Request Body:**
```json
{
  "question": "What is the expected format for the training data?",
  "isPublic": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "taskId": "uuid",
    "question": "What is the expected format...",
    "isPublic": true,
    "createdAt": "2024-01-16T09:00:00Z"
  },
  "message": "Question posted successfully"
}
```

---

### 12. Answer Question
Answer a question (company only).

**Endpoint:** `PUT /api/tasks/:id/questions/:questionId/answer`  
**Auth:** Required (Company only)

**Request Body:**
```json
{
  "answer": "The training data should be in CSV format with columns: query, intent, response..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "question": "What is the expected format...",
    "answer": "The training data should be...",
    "answeredBy": "uuid",
    "answeredAt": "2024-01-16T10:00:00Z"
  },
  "message": "Question answered successfully"
}
```

---

## NDA Management

### 13. Generate NDA
Generate NDA PDF for task.

**Endpoint:** `POST /api/tasks/:id/nda/generate`  
**Auth:** Required (Engineer only)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "taskId": "uuid",
    "ndaPdfUrl": "https://s3.amazonaws.com/ndas/task_uuid/engineer_email_timestamp.pdf",
    "signed": false,
    "createdAt": "2024-01-15T12:00:00Z"
  },
  "message": "NDA generated. Please review and sign."
}
```

---

### 14. Sign NDA
Digitally sign NDA.

**Endpoint:** `POST /api/tasks/:id/nda/sign`  
**Auth:** Required (Engineer only)

**Request Body:**
```json
{
  "signature": "base64_encoded_signature_data"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "taskId": "uuid",
    "signed": true,
    "signedAt": "2024-01-15T12:30:00Z",
    "signedPdfUrl": "https://s3.amazonaws.com/ndas/task_uuid/engineer_email_signed_timestamp.pdf",
    "ipAddress": "192.168.1.1"
  },
  "message": "NDA signed successfully. You can now view full task details."
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Validation error message"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": "Only companies can create tasks"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Task not found"
}
```

---

## Task Status Flow

```
draft → pending_escrow → open → in_progress → in_review → completed
                                                              ↓
                                                          cancelled
```

**Status Descriptions:**
- `draft` - Task created, not visible to engineers
- `pending_escrow` - Awaiting escrow deposit
- `open` - Live, accepting participations
- `in_progress` - Engineers working on task
- `in_review` - Submissions under evaluation
- `completed` - Winner selected, payout initiated
- `cancelled` - Task cancelled, escrow refunded

---

## Contest Mode

For contest tasks, define rank percentages in task creation:

```json
{
  "type": "contest",
  "isContest": true,
  "maxWinners": 3,
  "contestRanks": [
    { "rank": 1, "percentage": 50 },
    { "rank": 2, "percentage": 30 },
    { "rank": 3, "percentage": 20 }
  ]
}
```

**Rules:**
- Percentages must sum to 100%
- Max 10 winners allowed
- Payouts split automatically based on percentages

---

## Rate Limits

- Task creation: 10 per hour per company
- Participation: 20 per hour per engineer
- Submissions: 5 per task per engineer
- Questions: 20 per hour per user

---

## Webhooks (Future)

Razorpay webhooks for payment events:
- `payment.captured` - Escrow deposited
- `payout.processed` - Winner paid
- `payout.failed` - Payout failed

---

## Testing

### Test Mode
Use Razorpay test credentials:
```
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=test_secret
```

### Test Cards
- Success: 4111 1111 1111 1111
- Failure: 4000 0000 0000 0002

---

## Support

For API issues or questions:
- Email: api@neuronhire.com
- Docs: https://docs.neuronhire.com
- Status: https://status.neuronhire.com
