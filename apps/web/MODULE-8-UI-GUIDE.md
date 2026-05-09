# Module 8: UI Component Guide

## Visual Structure Overview

### 1. Admin Sidebar

```
┌──────────────────────────────┐
│ ◆ NeuronHire                 │
│   ADMIN  (amber label)       │
├──────────────────────────────┤
│ ▣ Overview      ← active    │
│   (amber left border + text) │
│ 👥 Engineers                 │
│ 🏢 Companies                 │
│ 📋 Assessments               │
│ ⏱ Tasks                     │
│ 🛒 Marketplace               │
│ 💳 Payments                  │
│ ⭐ Disputes                  │
│ 🛡 Moderation                │
│ ⚙ Settings                  │
├──────────────────────────────┤
│ AD  Admin                    │
│     Platform Admin           │
└──────────────────────────────┘
```

### 2. Admin Overview Page

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Platform Overview                                                           │
│ Real-time platform health and activity                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐      │
│ │TOTAL ENGINEERS│ │TOTAL COMPANIES│ │ACTIVE CONTRACTS│ │  GMV TODAY  │      │
│ │ 1,247 (cyan) │ │ 312 (violet) │ │  89 (green)  │ │ ₹4.9L (amber)│      │
│ │ +12 this week│ │ +3 this week │ │ ₹10.7L escrow│ │ ₹1.3Cr/month │      │
│ └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘      │
├─────────────────────────────────────────────────────────────────────────────┤
│ ⚠️ 4 open disputes  🚩 7 flagged assessments  🛡️ 12 moderation queue       │
│ (red badge)         (amber badge)              (violet badge)               │
├─────────────────────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────┐ ┌──────────────────────────┐ │
│ │ Platform Revenue                         │ │ Live Activity  ● Live    │ │
│ │                                          │ ├──────────────────────────┤ │
│ │ ₹8L ┤                          ╭──╮      │ │ 👤 New engineer signup   │ │
│ │ ₹6L ┤              ╭──╮  ╭──╯  ╯  ╰──╮  │ │    rahul.verma@...  2m   │ │
│ │ ₹4L ┤    ╭──╮  ╭──╯  ╰──╯            │  │ │ ✅ Assessment passed     │ │
│ │ ₹2L ┤╭──╯  ╰──╯                      │  │ │    Priya Nair (87)  8m   │ │
│ │     └──────────────────────────────   │  │ │ 💰 Payment released      │ │
│ │     Jun Jul Aug Sep Oct Nov           │  │ │    ₹50K Voice AI  15m    │ │
│ │     ■ Contracts ■ Bounties ■ Market   │  │ │ 🤝 New contract          │ │
│ └──────────────────────────────────────┘ │ │    MLOps ₹120K    32m    │ │
│                                           │ │ 🚩 Assessment flagged    │ │
│                                           │ │    Vikram Singh    1hr   │ │
│                                           │ └──────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────────┤
│ Conversion Funnel                                                           │
│                                                                             │
│ ① Signups           ████████████████████████████████████████ 1,247  100%  │
│ ② Profile Complete  ████████████████████████████████ 892           71.5%  │
│ ③ Assessment Taken  ██████████████████████████ 634                 50.8%  │
│ ④ Assessment Passed ████████████████ 421                           33.8%  │
│ ⑤ First Hire        ██████ 189                                     15.2%  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3. Engineer Management Table

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Engineer Management                                                         │
│ 6 engineers registered                                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ [Search by name or email…          ]  [All Status ▼]                       │
├─────────────────────────────────────────────────────────────────────────────┤
│ ☐  Name              Tier          Score  Status          Joined    Actions│
│ ─────────────────────────────────────────────────────────────────────────── │
│ ☐  Arjun Sharma      [Elite]       920    [Active]        2024-08   View   │
│    arjun@example.com                                                        │
│ ☐  Priya Nair        [Professional]845    [Active]        2024-09   View   │
│    priya@example.com                                                        │
│ ☐  Rahul Verma       [Verified]    720    [Pending Review]2024-11   View   │
│    rahul@example.com                                                        │
│ ☐  Vikram Singh 🚩5  [Conditional] 580    [Suspended]     2024-10   View   │
│    (amber row tint)                                                         │
│ ─────────────────────────────────────────────────────────────────────────── │
│ [1 selected]  [Suspend Selected]  [Clear]                                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4. Assessment Review Modal

```
┌─────────────────────────────────────────────────────────────┐
│ Review: Vikram Singh                                 [×]    │
├─────────────────────────────────────────────────────────────┤
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│ │ Track        │ │ Score        │ │ Duration     │        │
│ │ LLM Eng.     │ │ 61 (cyan)    │ │ 45 min       │        │
│ └──────────────┘ └──────────────┘ └──────────────┘        │
│                                                             │
│ Proctoring Event Log                                        │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🚩 TAB SWITCH                              Event #1     │ │
│ │    Engineer switched browser tabs during assessment     │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🚩 COPY PASTE                              Event #2     │ │
│ │    Copy-paste detected in code editor                   │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🚩 IDLE                                    Event #3     │ │
│ │    Extended idle period detected (>5 min)               │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Keystroke Heatmap                                           │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ [Heatmap visualization — available in production]       │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ [✓ Approve]  [Override Score]  [✗ Reject]                  │
└─────────────────────────────────────────────────────────────┘
```

### 5. Dispute Review Modal

```
┌─────────────────────────────────────────────────────────────┐
│ Dispute: Voice AI Agent                              [×]    │
├─────────────────────────────────────────────────────────────┤
│ ┌──────────────────────┐ ┌──────────────────────┐         │
│ │ Engineer             │ │ Company              │         │
│ │ Arjun Sharma         │ │ Sarvam AI            │         │
│ └──────────────────────┘ └──────────────────────┘         │
│                                                             │
│ 🤖 AI Audit Report                                          │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Code review shows TTS module partially implemented      │ │
│ │ (60%). Engineer submitted on deadline. Company claims   │ │
│ │ full implementation was expected. Recommend 70/30       │ │
│ │ split in favor of engineer.                             │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Resolution                                                  │
│ Engineer receives: 70% (₹105,000)                          │
│ [════════════════════════●──────────────────────]          │
│ Engineer: 70% (₹105,000)        Company: 30% (₹45,000)    │
│                                                             │
│ Decision Notes *                                            │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ [Required before Release Funds is enabled]              │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ [Release Funds & Resolve Dispute] (disabled until notes)   │
└─────────────────────────────────────────────────────────────┘
```

### 6. Moderation Queue

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Moderation Queue                                                            │
│ 4 items pending review · Flagged by OpenAI Moderation API                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ [All ✓] [Profile] [Product] [Review] [Message]                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ [profile]  [spam]  [pii]  Confidence: 94%              2024-11-20      │ │
│ │ By Vikram Singh (vikram@example.com)                                    │ │
│ │ ┌───────────────────────────────────────────────────────────────────┐  │ │
│ │ │ "Expert in all AI technologies. Guaranteed 10x ROI. Contact me   │  │ │
│ │ │  directly at +91-9876543210 for special rates."                   │  │ │
│ │ └───────────────────────────────────────────────────────────────────┘  │ │
│ │ [✓ Approve]  [✗ Remove]  [⚠ Warn User]                                │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ [review]  [inappropriate]  [hate_speech]  Confidence: 87%              │ │
│ │ By Anonymous Company                                                    │ │
│ │ ┌───────────────────────────────────────────────────────────────────┐  │ │
│ │ │ "This engineer is completely useless and a fraud..."              │  │ │
│ │ └───────────────────────────────────────────────────────────────────┘  │ │
│ │ [✓ Approve]  [✗ Remove]  [⚠ Warn User]                                │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7. Command Palette

```
┌─────────────────────────────────────────────────────────────┐
│ 🔍 Search pages, actions…                          ESC      │
├─────────────────────────────────────────────────────────────┤
│ NAVIGATE                                                    │
│ ▣ Dashboard                                                 │
│ ⏱ Browse Bounties                                           │
│ 🛒 Marketplace                                              │
│ ● My Wallet          ← selected (cyan bg)          ↵       │
│ 📈 Analytics                                                │
│ 💬 Messages                                                 │
│ ⚙ Settings                                                  │
│ 📊 Market Rates                                             │
│                                                             │
│ COMPANY                                                     │
│ 🔍 Find Engineers                                           │
│ ＋ Post a Task                                              │
│ 💳 Billing                                                  │
│                                                             │
│ ADMIN                                                       │
│ ⭐ Admin Dashboard                                          │
├─────────────────────────────────────────────────────────────┤
│ ↑↓ navigate   ↵ select   ESC close                         │
└─────────────────────────────────────────────────────────────┘
```

### 8. PWA Install Prompt

```
Mobile (bottom sheet):
┌─────────────────────────────────────────────────────────────┐
│                    ────                                     │
│ ◆  Add NeuronHire                                           │
│    Install for faster access and offline support            │
│                                                             │
│ [Add to Home Screen]                    [Not now]           │
└─────────────────────────────────────────────────────────────┘
(slides up from bottom, 300ms ease)

Desktop (top banner):
┌─────────────────────────────────────────────────────────────┐
│ ◆ Install NeuronHire  for faster access and offline support │
│                                          [Install]  [×]    │
└─────────────────────────────────────────────────────────────┘
(slides down from top, 300ms ease)
```

### 9. Push Notification Prompt

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                    🔔                                       │
│              Stay in the loop                               │
│   Get notified about new bounties, payments, and messages.  │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 💰 New bounty: Voice AI Agent — ₹50,000                 │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ✅ Payment released: ₹25,000 from Sarvam AI             │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 💬 New message from Priya at Zepto                      │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ [Enable Notifications]                      [Not now]      │
│                                                             │
│    You can change this anytime in Settings → Notifications  │
└─────────────────────────────────────────────────────────────┘
```

### 10. Offline Page

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│              ○ ○ ○ ○ ○ ○                                   │
│           ○           ○                                     │
│         ○   ┌───────┐   ○                                  │
│         ○   │  WiFi │   ○   (concentric rings, pulsing)    │
│         ○   │  off  │   ○                                  │
│         ○   └───────┘   ○                                  │
│           ○           ○                                     │
│              ○ ○ ○ ○ ○ ○                                   │
│                                                             │
│                 You're offline                              │
│   Check your connection and try again. Some pages you've   │
│   visited recently may still be available.                  │
│                                                             │
│              [Try Again]                                    │
│              [Go to Home]                                   │
│                                                             │
│   NeuronHire works best with a stable internet connection.  │
└─────────────────────────────────────────────────────────────┘
```

### 11. Assessment Keyboard Shortcuts Bar

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [MCQ ✓] [CODING] [SCENARIO]   1–4 select option  ↵ next  Alt+N / Alt+P nav │
│                                                          [Submit Assessment] │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Color Coding Reference

### Admin vs Engineer Sidebar
| Context | Accent | Active state |
|---------|--------|-------------|
| Engineer | `#00D4FF` (cyan) | Cyan left border + cyan text |
| Admin | `#F59E0B` (amber) | Amber left border + amber text |

### Moderation Flag Badges
| Flag | Style |
|------|-------|
| spam | Red pill |
| inappropriate | Red pill |
| misleading | Red pill |
| hate_speech | Red pill |
| pii | Red pill |

### Activity Feed Icons
| Type | Icon | Color |
|------|------|-------|
| signup | 👤 | cyan |
| assessment_pass | ✅ | green |
| payment | 💰 | green |
| dispute | ⚠️ | red |
| hire | 🤝 | violet |
| flag | 🚩 | amber |

---

## Accessibility Patterns

### Skip Link
```html
<a href="#main-content" class="skip-to-main">
  Skip to main content
</a>
<main id="main-content" tabindex="-1">
  ...
</main>
```
Visually hidden until focused (`:focus` slides it into view at top of page).

### Progress Bar
```html
<div
  role="progressbar"
  aria-valuenow="71.5"
  aria-valuemin="0"
  aria-valuemax="100"
  aria-label="Profile Complete: 71.5%"
>
  <div style="width: 71.5%" />
</div>
```

### Live Activity Feed
```html
<div role="log" aria-label="Platform activity feed" aria-live="polite">
  <!-- New items appended here are announced by screen readers -->
</div>
```

### Command Palette Input
```html
<input
  role="combobox"
  aria-expanded="true"
  aria-autocomplete="list"
  aria-controls="command-list"
  aria-activedescendant="cmd-nav-wallet"
/>
<div id="command-list" role="listbox">
  <button role="option" aria-selected="true" id="cmd-nav-wallet">My Wallet</button>
</div>
```

---

## Reduced Motion

All animations are gated behind `@media (prefers-reduced-motion: no-preference)`. Users with `prefers-reduced-motion: reduce` get:
- No translate/scale animations
- No blob drift, marquee, pulse-ring, skeleton shimmer
- Modals fade in with simple opacity (150ms) instead of slide-up

---

This guide provides a visual reference for all major UI components in Module 8.
