# Frontend Module 7: Payments, Analytics & Settings UI

## Overview

This module implements the complete payments, analytics, and settings experience for NeuronHire. It covers engineer earnings and withdrawals, company billing and escrow, market rate intelligence, profile analytics, and a comprehensive settings system with DPDP-compliant privacy controls.

## Features Implemented

### 1. Engineer Wallet (`/app/(engineer)/wallet/page.tsx`)

#### Hero Balance Card
- Large card with a subtle CSS-only grid pattern background (repeating linear gradients at 0.02 opacity)
- "Available Balance" label with balance in Syne display font, JetBrains Mono for the number
- Two CTAs: "Withdraw" (primary) and "Transaction History" (ghost)
- Secondary stats: Pending Release (amber) and This Month Earnings (green)

#### Withdrawal Modal
- Amount input with ₹ prefix, max capped at available balance
- USD conversion shown below input (mock rate: ₹83 = $1)
- Method toggle: UPI (instant, ≤2 hours) | NEFT (24 hours) — styled card selector
- UPI ID field pre-filled from profile, editable
- **KYC banner** appears for amounts > ₹50,000 with "Complete KYC" CTA — disables confirm button
- Confirmation info: "You will receive ₹X in your account within 2 hours"
- Success state: upward arrow + green checkmark animation

#### Earnings Chart
- Stacked AreaChart (Recharts) with three data series: Contracts | Bounties | Marketplace
- Period toggle: This Year | Last 6 Months | Last 30 Days — `role="group"` with `aria-label="Chart period"`
- Tooltip with monospace font showing per-source breakdown
- Legend with DM Sans font

#### Transaction History
- Preview table on main page (5 most recent)
- Full history in a modal with search input and type filter dropdown
- Columns: Date | Type | Description | Amount | Status | Invoice
- Type badges: Contract=cyan, Bounty=amber, Marketplace=violet, Payout=green
- Status badges: Pending=gray, Released=amber, Paid=green, Refunded=red
- Invoice column: PDF download link
- "Load More" button (cursor-based pagination pattern)

---

### 2. Company Billing (`/app/(company)/billing/page.tsx`)

#### Current Plan Card
- Plan name, monthly cost (monospace), features list with cyan checkmarks
- "Upgrade Plan" CTA
- Next billing date

#### Escrow Balance
- Total escrow in large accent-cyan monospace
- Per-contract breakdown: contract title, ID, amount, status badge
- "Add Funds" button opens modal

#### Add Funds Modal
- Amount input with ₹ prefix
- Live GST calculation (18%): Amount → GST → Total breakdown
- "Pay via Razorpay" button (disabled when amount ≤ 0)
- Success state with total added confirmation

#### Invoice History Table
- Columns: Date | Description | Amount | Status | GST Invoice
- Each row has a "↓ Download" link for GST invoice PDF

---

### 3. Engineer Analytics (`/app/(engineer)/analytics/page.tsx`)

#### Overview Stats (4 cards)
- **Profile Views**: 30-day count with trend arrow (green up / red down) and percentage
- **Acceptance Rate**: percentage with mini progress bar
- **Avg Response Time**: string value with benchmark comparison
- **NeuronScore**: score with mini sparkline (LineChart)

#### Profile Views Over Time Chart
- LineChart with daily granularity
- Annotated events as ReferenceLine overlays: "Updated portfolio", "Passed Elite tier"
- Dashed amber vertical lines with labels

#### Search Keywords Table
- "Top Search Keywords" — searches that surfaced the engineer's profile
- Columns: Keyword | Impressions | CTR
- CTR ≥ 12% shown in accent-green, others in text-secondary

#### Skill Market Demand Chart
- Horizontal BarChart (layout="vertical")
- Engineer's skills on Y-axis, job count on X-axis
- Gradient fill: gray → cyan (low to high pay signal)
- Tooltip shows job count + avg rate

#### NeuronScore History Chart
- LineChart over time with score on Y-axis
- Tooltip shows event that caused score change: "Bounty won +45 pts", "5-star review +15 pts"

---

### 4. Market Rate Intelligence (`/app/(public)/market-rates/page.tsx`)

- Searchable skill selector (filter chips)
- **Rate Range Visualization**: horizontal bar with percentile markers (P10, P25, Median, P75, P90)
  - Each marker: vertical tick + label + monospace rate value
  - Summary cards below: Entry Level | Market Median | Expert Level
- **NeuronScore Tier Breakdown**: horizontal bar chart per tier (Conditional → Verified → Professional → Elite)
  - Gradient fill, rate label inside bar
- **Related Skills**: clickable chips that switch the selected skill
- "Updated Weekly" badge in header
- Public page — no auth required

---

### 5. Settings (`/app/(engineer)/settings/page.tsx` and `/app/(company)/settings/page.tsx`)

#### Left Navigation
- Vertical tab list: Profile | Account | Notifications | Privacy | Billing | Danger Zone
- `role="tablist"` with `aria-label="Settings navigation"`, each button has `role="tab"` and `aria-selected`
- Active tab: accent-cyan background

#### Profile Tab
- Full Name, Headline, Bio fields
- **Dirty state detection**: Save button disabled until a field value differs from its initial value (derived state, no useEffect)
- `data-testid="save-profile-btn"`

#### Account Tab
- Email display with verified badge + "Change Email" button
- "Change Password" button
- Connected Accounts: Google OAuth status with disconnect option
- **Active Sessions table**: device, browser, location, last active
  - Current session marked with "Current" badge (no revoke button)
  - Other sessions have `data-testid="revoke-session-{id}"` revoke buttons
  - Revoking removes the session from state immediately

#### Notifications Tab
- Two groups: Email Notifications | Push Notifications (PWA)
- Categories: New Message | New Bounty Match | Payment Received | Contract Update
- Each toggle: `ToggleSwitch` component with `role="switch"` and `aria-checked`
- Smooth CSS transition (200ms) on the thumb and track

#### Privacy Tab (DPDP Compliant)
- Consent toggles: Marketing Emails | AI Recommendations | Public Activity Feed
- Each toggle has a description below the label
- **Download Your Data**: "Request Data Export" button — triggers async export, email sent when ready

#### Billing Tab (Engineer)
- Informational — redirects to `/engineer/wallet`

#### Danger Zone Tab
- Red-tinted section (`rgba(239,68,68,0.06)` background)
- "Delete Your Account" label + "Delete Account" button (`data-testid="open-delete-modal-btn"`)
- Opens `DeleteAccountModal`

#### Delete Account Modal (3-step)
- **Step 1**: Type exact account email to unlock Continue button
- **Step 2**: Checkbox — "I understand that my account will be permanently deleted..."
- **Step 3**: Final confirmation with `data-testid="final-delete-btn"`
- On delete: redirects to `/?deleted=true`

---

## Technical Implementation

### Files Created

```
apps/web/src/
├── lib/
│   └── payments-analytics-data.ts       # All types, mock data, helpers
├── app/
│   ├── (engineer)/
│   │   ├── wallet/page.tsx              # Engineer wallet & earnings
│   │   ├── analytics/page.tsx           # Engineer analytics dashboard
│   │   └── settings/page.tsx            # Engineer settings
│   ├── (company)/
│   │   ├── billing/page.tsx             # Company billing & escrow
│   │   └── settings/page.tsx            # Company settings
│   └── (public)/
│       └── market-rates/page.tsx        # Public market rate intelligence
└── __tests__/
    └── module-7-payments-analytics-settings.test.tsx
```

### Data Structures (`apps/web/src/lib/payments-analytics-data.ts`)

```typescript
// Transaction types
type TransactionType = 'contract' | 'bounty' | 'marketplace' | 'payout' | 'refund' | 'escrow_deposit';
type TransactionStatus = 'pending' | 'released' | 'paid' | 'refunded' | 'processing';
type PayoutMethod = 'upi' | 'neft';

// Wallet
interface WalletBalance {
  available: number;
  pending: number;
  thisMonthEarnings: number;
  currency: string;
}

interface Transaction {
  id: string;
  date: string;
  type: TransactionType;
  description: string;
  amount: number;
  status: TransactionStatus;
  invoiceUrl?: string;
}

// Analytics
interface AnalyticsOverview {
  profileViews: number;
  profileViewsTrend: number;
  proposalAcceptanceRate: number;
  avgResponseTime: string;
  neuronScore: number;
}

interface SearchKeyword {
  keyword: string;
  impressions: number;
  clickThroughRate: number;
}

interface SkillDemand {
  skill: string;
  jobCount: number;
  avgRate: number;
}

// Market Rates
interface MarketRate {
  skill: string;
  p10: number; p25: number; median: number; p75: number; p90: number;
  tierBreakdown: { tier: string; avgRate: number }[];
  relatedSkills: string[];
}

// Settings
interface NotificationPreferences {
  email: { newMessage: boolean; newBountyMatch: boolean; paymentReceived: boolean; contractUpdate: boolean };
  push:  { newMessage: boolean; newBountyMatch: boolean; paymentReceived: boolean; contractUpdate: boolean };
}

interface PrivacySettings {
  marketingEmails: boolean;
  aiRecommendations: boolean;
  publicActivityFeed: boolean;
}

interface ActiveSession {
  id: string;
  device: string;
  browser: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}
```

### Key Design Decisions

#### Dirty State Detection (Settings)
Avoids `useEffect` for dirty tracking. Instead, initial values are stored in a module-level constant and the `isDirty` flag is derived directly:

```typescript
const INITIAL_PROFILE = { name: 'Arjun Sharma', headline: '...', bio: '...' };

const isDirty =
  name !== INITIAL_PROFILE.name ||
  headline !== INITIAL_PROFILE.headline ||
  bio !== INITIAL_PROFILE.bio;
```

This ensures the Save button is disabled on mount and only activates after a real change.

#### Currency Formatting
`formatCurrency` uses `en-US` locale (not `en-IN`) to produce `₹118,000` instead of `₹1,18,000`, ensuring consistent display and test compatibility:

```typescript
export function formatCurrency(amount: number): string {
  return `₹${Math.abs(amount).toLocaleString('en-US')}`;
}
```

#### KYC Threshold
The withdrawal confirm button is disabled when `showKycBanner` is true (amount > ₹50,000) regardless of other validation, enforcing KYC completion before large withdrawals.

#### Toggle Switch Component
Reusable `ToggleSwitch` with full ARIA support:

```tsx
<button
  role="switch"
  aria-checked={checked}
  onClick={onChange}
  className={cn('relative w-11 h-6 rounded-full transition-all duration-200', ...)}
>
  <span className={cn('absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-200', checked && 'translate-x-5')} />
</button>
```

---

## Testing

Run tests:
```bash
npm test -- module-7-payments-analytics-settings.test.tsx
```

### Test Coverage (35 tests, all passing)

**Engineer Wallet (8 tests)**
- ✅ Renders hero balance card with available balance
- ✅ Shows secondary stats (pending release and this month earnings)
- ✅ Opens withdrawal modal when withdraw button is clicked
- ✅ Validates withdrawal amount cannot exceed available balance
- ✅ Shows KYC banner for amounts over ₹50,000
- ✅ Displays earnings chart with period toggles
- ✅ Displays transaction history with type badges
- ✅ Opens transaction history modal

**Engineer Analytics (5 tests)**
- ✅ Renders overview stats cards with trends
- ✅ Displays profile views chart with annotated events
- ✅ Shows search keywords table with CTR
- ✅ Displays skill market demand bar chart
- ✅ Shows NeuronScore history with events

**Company Billing (4 tests)**
- ✅ Renders current plan card with features
- ✅ Displays escrow balance with per-contract breakdown
- ✅ Opens add funds modal
- ✅ Calculates GST correctly (18% on ₹100,000 = ₹18,000, total ₹118,000)

**Market Rates (4 tests)**
- ✅ Renders skill selector with search
- ✅ Displays rate range visualization with percentiles
- ✅ Shows NeuronScore tier breakdown
- ✅ Displays related skills

**Settings (9 tests)**
- ✅ Renders left navigation with all tabs
- ✅ Detects dirty state in profile tab (Save button disabled until field changes)
- ✅ Displays active sessions with revoke buttons
- ✅ Revokes session correctly (removes from list)
- ✅ Renders notification toggles with smooth animation
- ✅ Toggles privacy settings
- ✅ Shows data export button
- ✅ Requires exact email match for account deletion
- ✅ Follows 3-step confirmation for account deletion

**Data Fetching & Caching (1 test)**
- ✅ Earnings chart data fetches only once per session

**Accessibility (3 tests)**
- ✅ Has proper ARIA labels on interactive elements
- ✅ Settings tabs have proper ARIA roles
- ✅ Toggle switches have proper ARIA attributes

---

## API Integration Points

### Required Backend Endpoints

```typescript
// Wallet
GET  /api/engineer/wallet/balance
GET  /api/engineer/wallet/transactions?cursor=...&type=...&q=...
POST /api/engineer/wallet/withdraw
GET  /api/engineer/wallet/earnings?period=year|6months|30days

// Analytics
GET  /api/engineer/analytics/overview
GET  /api/engineer/analytics/profile-views?days=30
GET  /api/engineer/analytics/keywords
GET  /api/engineer/analytics/skill-demand
GET  /api/engineer/analytics/neuron-score-history

// Market Rates
GET  /api/market-rates/:skill

// Company Billing
GET  /api/company/billing/plan
GET  /api/company/billing/escrow
GET  /api/company/billing/invoices
POST /api/company/billing/escrow/add-funds

// Settings
GET  /api/user/settings
PUT  /api/user/settings/profile
PUT  /api/user/settings/notifications
PUT  /api/user/settings/privacy
GET  /api/user/sessions
DELETE /api/user/sessions/:sessionId
POST /api/user/data-export
DELETE /api/user/account

// KYC
GET  /api/user/kyc/status
POST /api/user/kyc/initiate
```

### Razorpay Integration Points

```typescript
// Withdrawal payout
POST /api/razorpay/payout
{ amount, method: 'upi' | 'neft', upiId | bankAccount }

// Escrow top-up
POST /api/razorpay/order
{ amount, currency: 'INR', receipt: 'escrow_topup' }
```

---

## Business Rules

| Rule | Implementation |
|------|---------------|
| KYC required for withdrawals > ₹50,000 | KYC banner shown, confirm button disabled |
| GST 18% on escrow top-ups | Calculated live in Add Funds modal |
| 72-hour auto-approve for milestones | Countdown timer (pauses on weekends) — see Module 6 |
| Account deletion anonymizes data | 3-step confirmation, redirect to landing |
| DPDP consent toggles | Privacy tab with granular opt-in/opt-out |
| Market rates updated weekly | "Updated Weekly" badge on market rates page |

---

## Design Tokens Used

```css
--bg-base:     #080B14
--bg-surface:  #0E1220
--bg-elevated: #141828

--accent-cyan:   #00D4FF
--accent-amber:  #F59E0B
--accent-green:  #10B981
--accent-red:    #EF4444
--accent-violet: #7B5EA7

--text-primary:   #F0F4FF
--text-secondary: #8892A4
--text-muted:     #4A5568

/* Fonts */
--font-display: 'Syne'           /* headings, balances */
--font-body:    'DM Sans'        /* body text */
--font-mono:    'JetBrains Mono' /* numbers, amounts, code */
```

---

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

Proprietary — NeuronHire Platform
