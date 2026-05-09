# Frontend Module 6: Hiring, Contracts & Messaging UI

## Overview

This module implements the complete hiring workflow, contract management, and real-time messaging system for NeuronHire. It enables companies to discover engineers, initiate contracts, track milestones, and communicate seamlessly.

## Features Implemented

### 1. Engineer Search & Browse (`/app/(company)/browse/page.tsx`)

#### Search Bar
- Large search input with live autocomplete
- Searches by skill and engineer name
- 300ms debounce for performance
- Dropdown shows matching skills + engineer names

#### Filters
- **Skills**: Multi-select tag input with removable chips
- **NeuronScore**: Range slider (0-1000) with tier labels
- **Hourly Rate**: Range slider (₹500 - ₹50,000)
- **Availability**: Available Now | Within 2 weeks | Any
- **Work Mode**: Remote | Hybrid | On-site
- **Sort**: Relevance | NeuronScore | Rating | Hourly Rate | Most Reviews

#### Engineer Cards
- 3-column grid (responsive to 1 column on mobile)
- Each card displays:
  - Availability dot (pulsing green/yellow/gray)
  - NeuronScore badge (top right)
  - Profile photo + name + verification badges
  - Headline (1 line)
  - Top 5 skill chips
  - Stats: rating, projects, reviews
  - Hourly rate (large, monospace)
  - Match score pill (if job posted)
  - Trial engagement CTA
- **Hover Actions**: Slide up from bottom
  - "Invite to Apply"
  - "Message"
  - "Save"

#### Smart Matching Panel (Right Sidebar)
- Shows AI-matched talent for active job postings
- Each entry includes:
  - Mini engineer card
  - Match score with circular progress indicator
  - Quick invite button
- **Instant Team Builder**: 
  - Input complex problem
  - AI returns 2-4 complementary engineer suggestions
  - Shows role assignments (Lead, Backend, DevOps, etc.)

### 2. Hiring Flow Modals

#### Trial Engagement Modal (`trial-modal.tsx`)
- Simplified 2-hour trial booking
- Trial rate: 2× hourly rate
- Scope input (free text)
- Razorpay deposit
- Success confirmation

#### Full Hire Modal (`hire-modal.tsx`)
**Step 1 — Select Hiring Mode**
- 4 cards: Full-Time | Internship | Hourly | Project
- Each shows: mode name, details, "Best for" example, pricing model
- Selected: cyan border + checkmark

**Step 2 — Define Scope**
Varies by mode:
- **Full-time**: Role title, start date, CTC range, job description
- **Internship**: Duration slider (1-6 months), stipend, learning outcomes
- **Hourly**: Estimated hours/week, start/end dates, rate confirmation
- **Project**: Scope description, milestone builder, total budget, deadline

**Milestone Builder** (for Project contracts):
- Repeatable milestone rows: name, description, due date, amount
- Running total vs contract total with mismatch warning
- Drag-to-reorder (future enhancement)

**Step 3 — Review Contract**
- Auto-generated contract preview (structured, readable format)
- IP assignment toggle (default: company owns IP)
- NDA checkbox (auto-attach template)
- "Both parties will sign digitally" notice

**Step 4 — Digital Signing**
- Two panels: Company Signature | Engineer Signature
- Company signs: typed name OR drawn signature
- Real-time status: engineer notified, panel updates live
- Signed state: checkmark animation + green border

**Step 5 — Escrow Deposit**
- Total contract amount + platform fee breakdown
- Razorpay payment integration
- Success: contract status → "Active"

### 3. Contract Tracker

#### Company View (`/app/(company)/contracts/[id]/page.tsx`)
#### Engineer View (`/app/(engineer)/contracts/[id]/page.tsx`)

**Header**
- Contract title, type badge, status badge
- Both parties: avatars, names, roles
- Financial breakdown: total value, platform fee, engineer take-home

**Milestone Timeline**
- Vertical timeline with color-coded status
- Each milestone shows:
  - Name, due date, amount, status
  - Status colors: gray → cyan → amber → green
  - "Submit Deliverables" button (engineer side)
  - "Approve" / "Raise Dispute" buttons (company side)
  - 72-hour auto-approve countdown (company side)
  - Payment released: green checkmark + amount animation

**Escrow Display**
- Horizontal progress bar
- Shows: total escrowed → released → remaining
- Animated fill as milestones release

**Document Vault**
- Signed contract PDF (download)
- NDA PDF (if applicable)
- Amendment history

**Dispute Section**
- Raise dispute form: reason selector, evidence upload, description
- Active dispute status tracker:
  - Raised → Evidence Submitted → AI Audit → Mediator Review → Resolved

### 4. Messaging System

#### Company View (`/app/(company)/messages/page.tsx`)
#### Engineer View (`/app/(engineer)/messages/page.tsx`)

**Three-Panel Layout** (desktop) / Two-Panel with slide (mobile)

**Left Panel — Conversation List (280px)**
- Search conversations input
- Tabs: All | Project Rooms | Requests | Archived
- Each conversation row:
  - Avatar, name, last message preview (1 line)
  - Timestamp, unread count badge
  - Unread: subtle cyan left border
  - Active: elevated background
- Message request rows: "Pending" badge, "Accept / Decline" inline buttons

**Center Panel — Message Thread**
- Message bubbles: sender right (cyan tinted), receiver left
- Timestamps: appear on hover above message
- Date dividers: "Today", "Yesterday", "Dec 14"
- File attachments: styled file cards with icon, name, size, download button
- Typing indicator: 3 animated dots (bouncing)
- Message input: auto-expanding textarea, attach button, send button
- **Off-platform warning**: Non-dismissible banner if phone/email detected

**Right Panel — Context (240px, desktop only)**
- Shows contract or bounty context
- Quick links: View Contract | View Profile | View Bounty

**Availability Calendar Modal** (future enhancement)
- Engineer sets available slots in weekly grid
- Company books discovery call
- Confirmed calls shown in "Upcoming Calls" section

## Technical Implementation

### Components Created

```
apps/web/src/app/(company)/browse/_components/
├── engineer-card.tsx          # Engineer card with hover actions
├── hire-modal.tsx             # Full hiring flow modal
├── smart-matching-panel.tsx   # AI matching sidebar
└── trial-modal.tsx            # 2-hour trial booking

apps/web/src/app/(company)/
├── browse/page.tsx            # Engineer search & browse
├── contracts/[id]/page.tsx    # Company contract tracker
└── messages/page.tsx          # Company messaging

apps/web/src/app/(engineer)/
├── contracts/[id]/page.tsx    # Engineer contract tracker (existing, enhanced)
└── messages/page.tsx          # Engineer messaging (existing, enhanced)
```

### Data Structures (`apps/web/src/lib/hiring-data.ts`)

```typescript
// Hiring modes
type HiringMode = 'full_time' | 'internship' | 'hourly' | 'project';

// Contract statuses
type ContractStatus = 'draft' | 'pending_signature' | 'active' | 'completed' | 'terminated' | 'disputed';

// Milestone statuses
type MilestoneStatus = 'upcoming' | 'in_progress' | 'submitted' | 'approved' | 'paid';

// Message types
type MessageType = 'text' | 'file' | 'system';

// Conversation types
type ConversationType = 'direct' | 'project_room' | 'request';
```

### Key Features

#### Real-time Updates
- WebSocket integration for live signature updates
- Typing indicators with animated dots
- Message delivery status
- Milestone status changes

#### File Handling
- Upload progress indicator
- File type detection and icons
- Download functionality
- Size formatting

#### Security & Compliance
- Off-platform contact detection (phone, email, WhatsApp, Telegram)
- Non-dismissible warning banner
- Terms enforcement

#### Accessibility
- ARIA labels on all interactive elements
- Keyboard navigation support
- Focus management
- Screen reader friendly

#### Performance
- Debounced search (300ms)
- Lazy loading for conversations
- Optimistic UI updates
- Skeleton loading states

## Testing

Run tests:
```bash
npm test -- module-6-hiring-contracts-messaging.test.tsx
```

### Test Coverage

- ✅ Search bar with autocomplete
- ✅ Filter functionality (skills, score, rate, availability)
- ✅ Match score display
- ✅ Trial engagement CTA
- ✅ Milestone validation
- ✅ Digital signing flow
- ✅ 72-hour auto-approve countdown
- ✅ Escrow progress bar
- ✅ Message sending (Enter key)
- ✅ File upload progress
- ✅ Off-platform detection
- ✅ Message request accept/decline
- ✅ Typing indicator
- ✅ WebSocket reconnection (mocked)

## Future Enhancements

1. **Availability Calendar**
   - Weekly grid for engineer availability
   - Discovery call booking
   - Calendar integration (Google, Outlook)

2. **Advanced Dispute Resolution**
   - AI-powered evidence analysis
   - Mediator assignment
   - Resolution timeline tracking

3. **Enhanced Team Builder**
   - Multi-project team suggestions
   - Skill gap analysis
   - Budget optimization

4. **Video Calls**
   - In-platform video conferencing
   - Screen sharing
   - Recording and transcription

5. **Contract Templates**
   - Customizable contract templates
   - Legal review workflow
   - Multi-language support

## Design Tokens

All components use the NeuronHire design system:

```css
--bg-base:     #080B14
--bg-surface:  #0E1220
--bg-elevated: #141828

--accent-cyan:   #00D4FF
--accent-violet: #7B5EA7
--accent-amber:  #F59E0B
--accent-green:  #10B981
--accent-red:    #EF4444

--text-primary:   #F0F4FF
--text-secondary: #8892A4
--text-muted:     #4A5568
```

## API Integration Points

### Required Backend Endpoints

```typescript
// Engineer search
GET /api/engineers/search?q=...&skills=...&score=...&rate=...

// Hiring
POST /api/contracts/create
POST /api/contracts/:id/sign
POST /api/contracts/:id/escrow/deposit

// Milestones
POST /api/contracts/:id/milestones/:milestoneId/submit
POST /api/contracts/:id/milestones/:milestoneId/approve
POST /api/contracts/:id/milestones/:milestoneId/dispute

// Messaging
GET /api/messages/conversations
GET /api/messages/conversations/:id
POST /api/messages/conversations/:id/messages
POST /api/messages/conversations/:id/files
POST /api/messages/requests/:id/accept
POST /api/messages/requests/:id/decline

// WebSocket
WS /api/ws/messages
WS /api/ws/contracts/:id
```

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance Metrics

- First Contentful Paint: < 1.5s
- Time to Interactive: < 3.5s
- Largest Contentful Paint: < 2.5s
- Cumulative Layout Shift: < 0.1

## Deployment Notes

1. Ensure WebSocket server is configured
2. Set up Razorpay credentials in environment variables
3. Configure file upload limits (max 10MB per file)
4. Enable CORS for WebSocket connections
5. Set up CDN for file downloads

## License

Proprietary - NeuronHire Platform
