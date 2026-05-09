# Module 6: UI Component Guide

## Visual Structure Overview

### 1. Engineer Browse Page

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Find AI Engineers                                                           │
│ 6 verified engineers available                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ 🔍 Search by skill, e.g. 'LangChain agent developer'                       │
│     ↓ Autocomplete: LangChain, LlamaIndex, LangGraph...                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ Filters:                                                                    │
│ [LangChain ×] [PyTorch ×]  Score: [====●────●] 0-1000                     │
│ Rate: [====●────────●] ₹500-50K  [Available Now] [Within 2 weeks] [Any]   │
│ [Remote] [Hybrid] [On-site]  Sort: [Relevance ▼]                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │ ┌──────────────────┐│
│ │ ● Available  │ │ ● Available  │ │ ● In 2 weeks │ │ │ AI-Matched       ││
│ │ NeuronScore  │ │ NeuronScore  │ │ NeuronScore  │ │ │ Talent           ││
│ │ [920]        │ │ [845]        │ │ [780]        │ │ ├──────────────────┤│
│ │              │ │              │ │              │ │ │ ┌──────────────┐ ││
│ │ AS Arjun     │ │ PN Priya     │ │ RV Rahul     │ │ │ │AS 94% match │ ││
│ │ ✓ ✓          │ │ ✓ ✓          │ │ ✓            │ │ │ │Arjun Sharma │ ││
│ │ LLM Engineer │ │ ML Engineer  │ │ AI Product   │ │ │ │₹4,500/hr    │ ││
│ │              │ │              │ │              │ │ │ └──────────────┘ ││
│ │ [LangChain]  │ │ [TensorFlow] │ │ [OpenAI]     │ │ │ ┌──────────────┐ ││
│ │ [PyTorch]    │ │ [Kubernetes] │ │ [Pinecone]   │ │ │ │PN 87% match │ ││
│ │              │ │              │ │              │ │ │ │Priya Nair   │ ││
│ │ ★ 4.97       │ │ ★ 4.9        │ │ ★ 4.8        │ │ │ │₹3,800/hr    │ ││
│ │ 28 projects  │ │ 22 projects  │ │ 18 projects  │ │ │ └──────────────┘ ││
│ │              │ │              │ │              │ │ ├──────────────────┤│
│ │ ₹4,500/hr    │ │ ₹3,800/hr    │ │ ₹3,200/hr    │ │ │ [Instant Team  ] ││
│ │ 94% match    │ │ 87% match    │ │ 81% match    │ │ │ [  Builder     ] ││
│ │ or start     │ │ or start     │ │ or start     │ │ └──────────────────┘│
│ │ 2hr trial →  │ │ 2hr trial →  │ │ 2hr trial →  │ │                     │
│ │              │ │              │ │              │ │                     │
│ │ [Hover: Invite | Message | Save]                │                     │
│ └──────────────┘ └──────────────┘ └──────────────┘                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2. Hire Modal Flow

```
Step 1: Mode Selection
┌─────────────────────────────────────────────────────────────┐
│ Hire Arjun Sharma                                    [●○○○○] │
├─────────────────────────────────────────────────────────────┤
│ How do you want to engage with Arjun Sharma?               │
│                                                             │
│ ┌──────────────┐ ┌──────────────┐                         │
│ │ 💼 Full-Time │ │ 🎓 Internship│                         │
│ │ Permanent    │ │ 1-6 months   │                         │
│ │ Annual CTC   │ │ Monthly      │                         │
│ └──────────────┘ └──────────────┘                         │
│ ┌──────────────┐ ┌──────────────┐                         │
│ │ ⏱ Hourly     │ │ 🎯 Project   │ ← Selected              │
│ │ Pay per hour │ │ Fixed scope  │                         │
│ │ Per hour     │ │ Milestone    │                         │
│ └──────────────┘ └──────────────┘                         │
│                                                             │
│                                    [Continue →]            │
└─────────────────────────────────────────────────────────────┘

Step 2: Define Scope (Project Mode)
┌─────────────────────────────────────────────────────────────┐
│ Hire Arjun Sharma                                    [●●○○○] │
├─────────────────────────────────────────────────────────────┤
│ Project Scope *                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Build a multilingual voice AI agent...                 │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Milestones                    ⚠ Total ₹150K ≠ Budget ₹160K │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Milestone 1                                   [Remove]  │ │
│ │ [STT + LLM Pipeline    ] [2024-11-15]                  │ │
│ │ ₹ [50000]                                              │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Milestone 2                                   [Remove]  │ │
│ │ [TTS + Twilio         ] [2024-11-30]                   │ │
│ │ ₹ [50000]                                              │ │
│ └─────────────────────────────────────────────────────────┘ │
│ [+ Add milestone]                                           │
│                                                             │
│ Total Budget *                                              │
│ ₹ [150000]                                                  │
│                                                             │
│ [← Back]                          [Review Contract →]      │
└─────────────────────────────────────────────────────────────┘

Step 4: Digital Signing
┌─────────────────────────────────────────────────────────────┐
│ Hire Arjun Sharma                                    [●●●●○] │
├─────────────────────────────────────────────────────────────┤
│ Both parties must sign to activate the contract.           │
│                                                             │
│ ┌──────────────────────┐ ┌──────────────────────┐         │
│ │ Company Signature    │ │ Engineer Signature   │         │
│ │                      │ │                      │         │
│ │ ✓ Signed             │ │ ● ● ●                │         │
│ │                      │ │ Waiting for Arjun... │         │
│ └──────────────────────┘ └──────────────────────┘         │
│                                                             │
│                    [Proceed to Escrow Deposit →]           │
└─────────────────────────────────────────────────────────────┘
```

### 3. Contract Tracker

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [Active] [project]                                                          │
│ Build Multilingual Voice AI Agent                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ SA Sarvam AI ────────────────────────────────── AS Arjun Sharma            │
│ Company                                          Engineer                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                        │
│ │ ₹150,000     │ │ ₹15,000      │ │ ₹135,000     │                        │
│ │ Total Value  │ │ Platform Fee │ │ Take-home    │                        │
│ └──────────────┘ └──────────────┘ └──────────────┘                        │
├─────────────────────────────────────────────────────────────────────────────┤
│ Escrow Status                                                               │
│ [████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] │
│ Released: ₹50,000                              Remaining: ₹100,000          │
├─────────────────────────────────────────────────────────────────────────────┤
│ Milestones                                                                  │
│                                                                             │
│ ● ─┬─ STT + LLM Pipeline                                    ₹50,000        │
│    │  Due: 2024-11-15                                       [Paid]          │
│    │  ✓ ₹50,000 released to engineer                                       │
│    │                                                                        │
│ ● ─┬─ TTS + Twilio Integration                              ₹50,000        │
│    │  Due: 2024-11-30                                       [Submitted]     │
│    │  ⏱ Auto-approves in 60h 15m                                           │
│    │  [Approve & Release ₹50,000] [Raise Dispute]                          │
│    │                                                                        │
│ ○ ─┴─ Load Testing & Deployment                             ₹50,000        │
│       Due: 2024-12-15                                       [Upcoming]      │
├─────────────────────────────────────────────────────────────────────────────┤
│ Document Vault                                                              │
│ 📄 Signed Contract.pdf                                     [Download]      │
│ 🔒 NDA Agreement.pdf                                       [Download]      │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4. Messaging Interface

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│ ┌────────────────┐ ┌──────────────────────────────────────┐ ┌──────────────────┐   │
│ │ Messages       │ │ SA Sarvam AI — Voice Agent           │ │ Context          │   │
│ │ [Search...]    │ │ Project Room · Contract #contract-1  │ │                  │   │
│ ├────────────────┤ ├──────────────────────────────────────┤ ├──────────────────┤   │
│ │[All][Rooms]... │ │                                      │ │ Related Contract │   │
│ ├────────────────┤ │ ────────── Today ──────────          │ │ 📄 View Contract │   │
│ │● SA Sarvam AI  │ │                                      │ │                  │   │
│ │  The STT...  2h│ │     ┌──────────────────────────┐    │ │ Quick Links      │   │
│ │  [3]           │ │     │ Can you share progress?  │    │ │ 👤 View Profile  │   │
│ ├────────────────┤ │     └──────────────────────────┘    │ │ 🎯 View Bounty   │   │
│ │  PM Priya      │ │                                      │ │                  │   │
│ │  Thanks for... │ │ ┌──────────────────────────┐        │ └──────────────────┘   │
│ ├────────────────┤ │ │ Sure! Hindi and English  │        │                        │
│ │  ZP Zepto      │ │ │ models done. Tamil 80%.  │        │                        │
│ │  Hi, we'd...   │ │ └──────────────────────────┘        │                        │
│ │  [Pending]     │ │                                      │                        │
│ │  [Accept][Dec] │ │ ┌──────────────────────────┐        │                        │
│ └────────────────┘ │ │ 📎 architecture.pdf      │        │                        │
│                    │ │    2.4 MB            [↓] │        │                        │
│                    │ └──────────────────────────┘        │                        │
│                    │                                      │                        │
│                    │     ┌──────────────────────────┐    │                        │
│                    │     │ Ready for review         │    │                        │
│                    │     └──────────────────────────┘    │                        │
│                    │                                      │                        │
│                    │ ● ● ●  Typing...                     │                        │
│                    ├──────────────────────────────────────┤                        │
│                    │ ⚠ Sharing contact info outside the  │                        │
│                    │   platform is against terms.         │                        │
│                    ├──────────────────────────────────────┤                        │
│                    │ 📎 [Type a message...          ] [→] │                        │
│                    └──────────────────────────────────────┘                        │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

### 5. Trial Engagement Modal

```
┌─────────────────────────────────────────────────────────────┐
│ 2-Hour Trial with Arjun Sharma                       [×]    │
├─────────────────────────────────────────────────────────────┤
│ ℹ How it works: Book a 2-hour trial to test compatibility  │
│   • 2 hours of focused work                                 │
│   • Premium trial rate (2× hourly)                          │
│   • Full refund if not satisfied                            │
│                                                             │
│ Trial Scope                                                 │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Build a proof-of-concept RAG system with LangChain...  │ │
│ │                                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Trial Rate (2 hours)                          ₹18,000      │
│ Platform Fee (10%)                             ₹1,800      │
│ ─────────────────────────────────────────────────────────  │
│ Total to Deposit                              ₹19,800      │
│                                                             │
│ [Deposit & Book Trial]                        [Cancel]     │
└─────────────────────────────────────────────────────────────┘
```

### 6. Smart Matching Panel

```
┌──────────────────────────────────────┐
│ 🤖 AI-Matched Talent                 │
│ Top matches for your job posting    │
├──────────────────────────────────────┤
│ ┌──────────────────────────────────┐ │
│ │ AS Arjun Sharma                  │ │
│ │ LLM Engineer · RAG Systems       │ │
│ │                                  │ │
│ │ ◐ 94 match  ₹4,500/hr            │ │
│ │ [LangChain] [PyTorch] [FastAPI]  │ │
│ │ [Invite to Apply]                │ │
│ └──────────────────────────────────┘ │
│ ┌──────────────────────────────────┐ │
│ │ PN Priya Nair                    │ │
│ │ ML Engineer · Computer Vision    │ │
│ │                                  │ │
│ │ ◐ 87 match  ₹3,800/hr            │ │
│ │ [TensorFlow] [Kubernetes] [AWS]  │ │
│ │ [Invite to Apply]                │ │
│ └──────────────────────────────────┘ │
├──────────────────────────────────────┤
│ [🤝 Instant Team Builder]            │
└──────────────────────────────────────┘
```

## Color Coding

### Status Colors
- **Gray** (#4A5568): Upcoming, Not started
- **Cyan** (#00D4FF): In progress, Active
- **Amber** (#F59E0B): Submitted, Pending
- **Green** (#10B981): Approved, Paid, Success
- **Red** (#EF4444): Disputed, Error

### Availability Indicators
- **Green pulsing**: Available Now
- **Yellow**: Within 2 weeks
- **Gray**: Not specified

### Match Scores
- **90-100%**: Excellent match (bright cyan)
- **80-89%**: Good match (cyan)
- **70-79%**: Fair match (muted cyan)
- **<70%**: Not shown

## Interactive Elements

### Hover States
- **Engineer Cards**: Slide up actions (Invite | Message | Save)
- **Message Bubbles**: Show timestamp
- **Buttons**: Brightness increase + scale
- **Links**: Underline + color change

### Loading States
- **Skeleton**: Shimmer animation
- **Progress Bar**: Smooth fill animation
- **Spinner**: Rotating circle
- **Typing Indicator**: Bouncing dots

### Transitions
- **Modal**: Fade up (300ms)
- **Slide**: Slide in/out (300ms)
- **Hover**: Transform + shadow (150ms)
- **Focus**: Ring + scale (150ms)

## Responsive Breakpoints

```
Mobile:   < 640px  (1 column)
Tablet:   640-1024px (2 columns)
Desktop:  1024-1280px (3 columns)
Wide:     > 1280px (3 columns + sidebar)
```

## Accessibility Features

- **ARIA Labels**: All interactive elements
- **Keyboard Navigation**: Tab order, Enter/Escape
- **Focus Indicators**: Visible focus rings
- **Screen Reader**: Descriptive labels
- **Color Contrast**: WCAG AA compliant

## Animation Timing

```css
--duration-fast:   150ms  (hover, focus)
--duration-normal: 300ms  (transitions)
--duration-slow:   600ms  (page transitions)

--ease-out-expo:     cubic-bezier(0.16, 1, 0.3, 1)
--ease-in-out-quart: cubic-bezier(0.76, 0, 0.24, 1)
```

---

This guide provides a visual reference for all major UI components in Module 6. Use it as a reference when implementing or reviewing the interface.
