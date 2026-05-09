# Module 7: UI Component Guide

## Visual Structure Overview

### 1. Engineer Wallet Page

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│ ░  Available Balance                                                      ░ │
│ ░  ₹245,000                                                               ░ │
│ ░                                                                         ░ │
│ ░  [Withdraw]  [Transaction History]                                      ░ │
│ ░                                                                         ░ │
│ ░  Pending Release    This Month Earnings                                 ░ │
│ ░  ₹85,000 (amber)   ₹180,000 (green)                                    ░ │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│ (subtle CSS grid pattern at 2% opacity)                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ Monthly Earnings                    [This Year] [Last 6 Months] [Last 30D] │
│                                                                             │
│ ₹325K ┤                                    ╭──╮                            │
│ ₹250K ┤                          ╭──╮  ╭──╯  ╰──╮                         │
│ ₹175K ┤              ╭──╮  ╭──╯  ╯  ╰──╯                                  │
│ ₹100K ┤    ╭──╮  ╭──╯  ╰──╯                                               │
│       └────┴──┴──┴──────────────────────────────                           │
│       May  Jun  Jul  Aug  Sep  Oct  Nov                                     │
│       ■ Contracts  ■ Bounties  ■ Marketplace                               │
├─────────────────────────────────────────────────────────────────────────────┤
│ Recent Transactions                                    [View All →]         │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ [contract]  Voice AI Agent - Milestone 1    +₹50,000  [paid]   [↓ PDF] │ │
│ │ [bounty]    RAG System Optimization         +₹25,000  [paid]   [↓ PDF] │ │
│ │ [marketplace] LangChain Template Sale       +₹5,000   [paid]   [↓ PDF] │ │
│ │ [payout]    Withdrawal to UPI               -₹100,000 [paid]   [—]     │ │
│ │ [contract]  Voice AI Agent - Milestone 2    +₹50,000  [released][↓ PDF]│ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2. Withdrawal Modal

```
Normal state (amount ≤ ₹50,000):
┌─────────────────────────────────────────────────────────────┐
│ Withdraw Funds                                       [×]    │
├─────────────────────────────────────────────────────────────┤
│ Amount                                                      │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ₹  [30000                                             ] │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ≈ $361.45 USD                    Max: ₹245,000              │
│                                                             │
│ Withdrawal Method                                           │
│ ┌──────────────────────┐ ┌──────────────────────┐         │
│ │ UPI ✓                │ │ NEFT                 │         │
│ │ Instant, ≤2 hours    │ │ 24 hours             │         │
│ └──────────────────────┘ └──────────────────────┘         │
│ (cyan border on selected)                                   │
│                                                             │
│ UPI ID                                                      │
│ [arjun@paytm                                              ] │
│                                                             │
│ ℹ You will receive ₹30,000 in your account within 2 hours  │
│                                                             │
│ [Withdraw ₹30,000]                          [Cancel]       │
└─────────────────────────────────────────────────────────────┘

KYC state (amount > ₹50,000):
┌─────────────────────────────────────────────────────────────┐
│ Withdraw Funds                                       [×]    │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ⚠ KYC Required                                         │ │
│ │ Complete KYC to withdraw amounts over ₹50,000          │ │
│ │                                          [Complete KYC] │ │
│ └─────────────────────────────────────────────────────────┘ │
│ (red-tinted banner, confirm button disabled)                │
└─────────────────────────────────────────────────────────────┘
```

### 3. Company Billing Page

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Billing & Payments                                                          │
│ Manage your subscription and escrow funds                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ Growth Plan  [Current]                                    ₹9,999 /month    │
│ Perfect for growing teams                                                   │
│                                                                             │
│ Features                                                                    │
│ ✓ Up to 10 active contracts                                                 │
│ ✓ Unlimited job postings                                                    │
│ ✓ Priority support                                                          │
│ ✓ Advanced analytics                                                        │
│ ✓ Custom contract templates                                                 │
│                                          [Upgrade Plan]                    │
│ Next billing date: December 1, 2024                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ Escrow Balance                                          [Add Funds]         │
│                                                                             │
│ Total in Escrow                                                             │
│ ₹225,000 (large, accent-cyan)                                               │
│                                                                             │
│ Per-Contract Breakdown                                                      │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ Voice AI Agent          Contract #contract-1    ₹100,000  [active]     │ │
│ │ MLOps Pipeline          Contract #contract-2    ₹75,000   [active]     │ │
│ │ Data Pipeline           Contract #contract-3    ₹50,000   [active]     │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────────┤
│ Invoice History                                                             │
│ Date        Description                  Amount    Status   GST Invoice    │
│ 2024-11-20  Voice AI Agent - Milestone 1 ₹50,000  [paid]   ↓ Download    │
│ 2024-11-18  RAG System Optimization      ₹25,000  [paid]   ↓ Download    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4. Add Funds Modal (with GST)

```
┌─────────────────────────────────────────────────────────────┐
│ Add Funds to Escrow                                  [×]    │
├─────────────────────────────────────────────────────────────┤
│ Amount to Add                                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ₹  [100000                                            ] │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Amount                                          ₹100,000   │
│ ─────────────────────────────────────────────────────────  │
│ GST (18%)                                        ₹18,000   │
│ ─────────────────────────────────────────────────────────  │
│ Total                                           ₹118,000   │
│ (accent-cyan)                                               │
│                                                             │
│ ℹ Funds will be held in escrow and released to engineers   │
│   upon milestone approval.                                  │
│                                                             │
│ [Pay via Razorpay]                              [Cancel]   │
└─────────────────────────────────────────────────────────────┘
```

### 5. Engineer Analytics Page

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Analytics                                                                   │
│ Track your profile performance and market insights                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐      │
│ │ PROFILE VIEWS│ │ACCEPTANCE RATE│ │AVG RESP TIME │ │ NEURONSCORE  │      │
│ │              │ │              │ │              │ │              │      │
│ │ 1,247  ↑18.5%│ │ 68%          │ │ 2.3 hours    │ │ 920          │      │
│ │ Last 30 days │ │ ████████░░░░ │ │ Faster than  │ │ ╭──╮         │      │
│ │              │ │              │ │ 78% of eng.  │ │╭╯  ╰─        │      │
│ └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘      │
├─────────────────────────────────────────────────────────────────────────────┤
│ Profile Views Over Time                                                     │
│                                                                             │
│  75 ┤                                    ╭──╮                              │
│  50 ┤              ╭──╮  ╭──╮  ╭──╮  ╭──╯  ╰──╮                          │
│  25 ┤    ╭──╮  ╭──╯  ╰──╯  ╰──╯  ╰──╯                                    │
│     └────┴──┴──┴──────────────────────────────                             │
│          ┊ Updated portfolio    ┊ Passed Elite tier                        │
│          (amber dashed lines with labels)                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ Top Search Keywords                                                         │
│ Searches that showed your profile in the last 30 days                      │
│                                                                             │
│ Keyword          Impressions    CTR                                         │
│ LangChain        342            12.5% (green)                              │
│ RAG Systems      287            15.2% (green)                              │
│ PyTorch          256            9.8%                                        │
│ FastAPI          198            11.1%                                       │
│ LLM Fine-tuning  176            18.7% (green)                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ Skill Market Demand                                                         │
│ Jobs requiring your skills in the last 30 days                             │
│                                                                             │
│ LangChain    ████████████████████████████████████████████ 45              │
│ PyTorch      ████████████████████████████████████ 38                      │
│ RAG Systems  ██████████████████████████████ 32                            │
│ FastAPI      ████████████████████████ 28                                  │
│ (gradient: gray → cyan, left to right)                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ NeuronScore History                                                         │
│                                                                             │
│ 920 ┤                                                    ●                 │
│ 780 ┤                                    ●──────────────╯                  │
│ 765 ┤                    ●──────────────╯                                  │
│ 720 ┤    ●──────────────╯                                                  │
│     └────┴──────────────┴──────────────┴──────────────┴                   │
│          Aug             Sep             Oct             Nov               │
│ (hover tooltip: "Elite tier achieved +140 pts")                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6. Market Rate Intelligence Page

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Market Rate Intelligence                                 │
│         Real-time hourly rate data for AI/ML skills on NeuronHire          │
│                          [Updated Weekly]                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ Select Skill                                                                │
│ [Search skills...                                                         ] │
│ [LangChain ✓]  [PyTorch]                                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ Hourly Rate Range for LangChain                                             │
│                                                                             │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│ (gradient bar from P10 to P90)                                              │
│                                                                             │
│    │         │              │              │         │                      │
│   P10       P25           Median          P75       P90                    │
│  ₹2,500    ₹3,500         ₹4,500         ₹5,500    ₹7,000                 │
│                                                                             │
│ ┌──────────────┐ ┌──────────────────────────┐ ┌──────────────┐           │
│ │ Entry Level  │ │     Market Median        │ │ Expert Level │           │
│ │ ₹2,500       │ │     ₹4,500 (cyan)        │ │ ₹7,000       │           │
│ └──────────────┘ └──────────────────────────┘ └──────────────┘           │
├─────────────────────────────────────────────────────────────────────────────┤
│ Rate by NeuronScore Tier                                                    │
│                                                                             │
│ [Conditional]  ████████████████████████████████████ ₹2,800/hr             │
│ [Verified]     ████████████████████████████████████████████ ₹3,800/hr     │
│ [Professional] ████████████████████████████████████████████████ ₹4,800/hr │
│ [Elite]        ████████████████████████████████████████████████████ ₹6,500/hr│
│ (gradient fill: cyan → lighter cyan)                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│ Related Skills                                                              │
│ [LlamaIndex]  [RAG Systems]  [OpenAI]  [Vector DBs]                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7. Settings Page

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ┌──────────────────┐ ┌───────────────────────────────────────────────────┐ │
│ │ 👤 Profile  ←    │ │ Profile Settings                                  │ │
│ │ 🔐 Account       │ │ Update your public profile information            │ │
│ │ 🔔 Notifications │ ├───────────────────────────────────────────────────┤ │
│ │ 🛡️ Privacy       │ │ Full Name                                         │ │
│ │ 💳 Billing       │ │ [Arjun Sharma                                   ] │ │
│ │ ⚠️ Danger Zone   │ │                                                   │ │
│ └──────────────────┘ │ Headline                                          │ │
│ (active tab: cyan bg)│ [LLM Engineer · RAG Systems · Agentic AI        ] │ │
│                      │                                                   │ │
│                      │ Bio                                               │ │
│                      │ ┌───────────────────────────────────────────────┐ │ │
│                      │ │ Specialized in building production-grade...   │ │ │
│                      │ └───────────────────────────────────────────────┘ │ │
│                      │                                                   │ │
│                      │                          [Save Changes] (disabled)│ │
│                      │                          (enabled when dirty)     │ │
│                      └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 8. Account Tab — Active Sessions

```
┌─────────────────────────────────────────────────────────────┐
│ Active Sessions                                             │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ MacBook Pro  [Current]                                  │ │
│ │ Chrome 120 · Bangalore, India                           │ │
│ │ Last active: 2 minutes ago                              │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ iPhone 15                                  [Revoke]     │ │
│ │ Safari · Bangalore, India                               │ │
│ │ Last active: 3 hours ago                                │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Windows PC                                 [Revoke]     │ │
│ │ Edge 120 · Mumbai, India                                │ │
│ │ Last active: 2 days ago                                 │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 9. Notifications Tab — Toggle Switches

```
┌─────────────────────────────────────────────────────────────┐
│ Notifications                                               │
│ Manage how you receive notifications                        │
├─────────────────────────────────────────────────────────────┤
│ Email Notifications                                         │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ New Message                              [●──────] ON   │ │
│ │ New Bounty Match                         [●──────] ON   │ │
│ │ Payment Received                         [●──────] ON   │ │
│ │ Contract Update                          [●──────] ON   │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Push Notifications (PWA)                                    │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ New Message                              [●──────] ON   │ │
│ │ New Bounty Match                         [──────●] OFF  │ │
│ │ Payment Received                         [●──────] ON   │ │
│ │ Contract Update                          [──────●] OFF  │ │
│ └─────────────────────────────────────────────────────────┘ │
│ (toggle: 44×24px, thumb slides 20px, 200ms transition)      │
└─────────────────────────────────────────────────────────────┘
```

### 10. Privacy Tab

```
┌─────────────────────────────────────────────────────────────┐
│ Privacy Settings                                            │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Marketing Emails                         [●──────] OFF  │ │
│ │ Receive updates about new features and offers           │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ AI Recommendations                       [●──────] ON   │ │
│ │ Use profile data for personalized job matches           │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ Public Activity Feed                     [●──────] ON   │ │
│ │ Show your activity on your public profile               │ │
│ └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ Download Your Data                                          │
│ Request a copy of all your data. We'll email you when      │
│ it's ready.                                                 │
│                                                             │
│ [Request Data Export]                                       │
└─────────────────────────────────────────────────────────────┘
```

### 11. Delete Account — 3-Step Flow

```
Step 1: Email Confirmation
┌─────────────────────────────────────────────────────────────┐
│ Delete Account                                       [×]    │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ⚠️ This action cannot be undone                         │ │
│ │ Your account will be permanently deleted. All your      │ │
│ │ data will be anonymized and cannot be recovered.        │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Type your email to confirm: arjun.sharma@example.com       │
│ [                                                         ] │
│                                                             │
│ [Continue] (disabled until email matches)   [Cancel]       │
└─────────────────────────────────────────────────────────────┘

Step 2: Understanding Confirmation
┌─────────────────────────────────────────────────────────────┐
│ Delete Account                                       [×]    │
├─────────────────────────────────────────────────────────────┤
│ Please confirm you understand:                              │
│                                                             │
│ ☐ I understand that my account will be permanently         │
│   deleted, all data will be anonymized, and this action    │
│   cannot be reversed.                                       │
│                                                             │
│ [I Understand, Continue] (disabled until checked) [Back]   │
└─────────────────────────────────────────────────────────────┘

Step 3: Final Confirmation
┌─────────────────────────────────────────────────────────────┐
│ Delete Account                                       [×]    │
├─────────────────────────────────────────────────────────────┤
│                  Final Confirmation                         │
│   Are you absolutely sure you want to delete your account? │
│                                                             │
│ [Yes, Delete My Account]                        [Cancel]   │
└─────────────────────────────────────────────────────────────┘
```

---

## Color Coding Reference

### Transaction Type Badges
| Type | Color | Token |
|------|-------|-------|
| Contract | Cyan | `accent-cyan` |
| Bounty | Amber | `accent-amber` |
| Marketplace | Violet | `accent-violet` |
| Payout | Green | `accent-green` |
| Refund | Red | `accent-red` |

### Transaction Status Badges
| Status | Color |
|--------|-------|
| Pending | Gray |
| Released | Amber |
| Paid | Green |
| Refunded | Red |
| Processing | Cyan |

### NeuronScore Tier Badges
| Tier | Color |
|------|-------|
| Elite | Amber |
| Professional | Cyan |
| Verified | Violet |
| Conditional | Gray |

---

## Interactive States

### Toggle Switch
```
OFF state:  [○────────]  bg: rgba(255,255,255,0.1)  thumb: left
ON state:   [────────●]  bg: accent-cyan             thumb: right (translate-x-5)
Transition: 200ms on both track color and thumb position
```

### Dirty State (Profile Save Button)
```
Clean:  [Save Changes]  opacity-50, cursor-not-allowed, pointer-events-none
Dirty:  [Save Changes]  full opacity, clickable, cyan glow
```

### KYC Banner
```
Trigger:  withdrawal amount > ₹50,000
Style:    red-tinted bg, red border, warning icon
Effect:   confirm button disabled regardless of other validation
Dismiss:  not dismissible — must complete KYC or reduce amount
```

---

## Responsive Behavior

```
Mobile  (<640px):  Single column, modals full-width, settings nav collapses
Tablet  (640px+):  Two columns for stats cards, side-by-side modals
Desktop (1024px+): Full layout, settings with sidebar nav
```

## Animation Timing

```css
/* Toggle switch */
transition-all duration-200   /* 200ms, all properties */

/* Modal entrance */
animate-fade-up               /* defined in tailwind config */

/* Chart bars */
transition-all duration-700   /* 700ms for bar width fill */

/* Button hover */
hover:brightness-110          /* instant */
active:scale-[0.97]           /* instant */
```

---

This guide provides a visual reference for all major UI components in Module 7. Use it alongside `MODULE-7-README.md` for full implementation details.
