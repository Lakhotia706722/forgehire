/**
 * Mock data for Admin Dashboard (Module 8).
 */

// ─── Platform Stats ───────────────────────────────────────────
export interface PlatformStats {
  totalEngineers: number;
  totalCompanies: number;
  activeContracts: number;
  gmvToday: number;
  gmvWeek: number;
  gmvMonth: number;
  pendingDisputes: number;
  flaggedAssessments: number;
  moderationQueue: number;
}

export const MOCK_PLATFORM_STATS: PlatformStats = {
  totalEngineers: 1_247,
  totalCompanies: 312,
  activeContracts: 89,
  gmvToday: 485_000,
  gmvWeek: 3_240_000,
  gmvMonth: 12_800_000,
  pendingDisputes: 4,
  flaggedAssessments: 7,
  moderationQueue: 12,
};

// ─── Revenue Chart ────────────────────────────────────────────
export interface RevenueDataPoint {
  date: string;
  contracts: number;
  bounties: number;
  marketplace: number;
  total: number;
}

export const MOCK_REVENUE_DATA: RevenueDataPoint[] = [
  { date: '2024-06', contracts: 320000, bounties: 85000, marketplace: 22000, total: 427000 },
  { date: '2024-07', contracts: 410000, bounties: 110000, marketplace: 31000, total: 551000 },
  { date: '2024-08', contracts: 480000, bounties: 130000, marketplace: 38000, total: 648000 },
  { date: '2024-09', contracts: 520000, bounties: 145000, marketplace: 42000, total: 707000 },
  { date: '2024-10', contracts: 610000, bounties: 160000, marketplace: 55000, total: 825000 },
  { date: '2024-11', contracts: 580000, bounties: 155000, marketplace: 48000, total: 783000 },
];

// ─── Conversion Funnel ────────────────────────────────────────
export interface FunnelStep {
  label: string;
  count: number;
  percentage: number;
}

export const MOCK_FUNNEL: FunnelStep[] = [
  { label: 'Signups',            count: 1247, percentage: 100 },
  { label: 'Profile Complete',   count: 892,  percentage: 71.5 },
  { label: 'Assessment Taken',   count: 634,  percentage: 50.8 },
  { label: 'Assessment Passed',  count: 421,  percentage: 33.8 },
  { label: 'First Hire',         count: 189,  percentage: 15.2 },
];

// ─── Activity Feed ────────────────────────────────────────────
export type ActivityType = 'signup' | 'assessment_pass' | 'payment' | 'dispute' | 'hire' | 'flag';

export interface ActivityItem {
  id: string;
  type: ActivityType;
  message: string;
  timestamp: string;
  meta?: string;
}

export const MOCK_ACTIVITY: ActivityItem[] = [
  { id: 'act-1', type: 'signup',           message: 'New engineer signup: Rahul Verma',          timestamp: '2 min ago',  meta: 'rahul.verma@gmail.com' },
  { id: 'act-2', type: 'assessment_pass',  message: 'Assessment passed: Priya Nair (Score: 87)', timestamp: '8 min ago',  meta: 'LLM Engineering' },
  { id: 'act-3', type: 'payment',          message: 'Payment released: ₹50,000 — Voice AI Agent', timestamp: '15 min ago', meta: 'Sarvam AI → Arjun Sharma' },
  { id: 'act-4', type: 'hire',             message: 'New contract: MLOps Pipeline — ₹120,000',   timestamp: '32 min ago', meta: 'Zepto → Priya Nair' },
  { id: 'act-5', type: 'flag',             message: 'Assessment flagged: Suspicious tab switch',  timestamp: '1 hr ago',   meta: 'Vikram Singh' },
  { id: 'act-6', type: 'dispute',          message: 'Dispute opened: Milestone 2 not delivered', timestamp: '2 hrs ago',  meta: 'Contract #contract-4' },
  { id: 'act-7', type: 'signup',           message: 'New company signup: Razorpay',               timestamp: '3 hrs ago',  meta: 'hr@razorpay.com' },
  { id: 'act-8', type: 'assessment_pass',  message: 'Assessment passed: Ananya Iyer (Score: 92)', timestamp: '4 hrs ago', meta: 'Computer Vision' },
];

// ─── Engineers ────────────────────────────────────────────────
export type EngineerStatus = 'active' | 'suspended' | 'pending_review';

export interface AdminEngineer {
  id: string;
  name: string;
  email: string;
  tier: string;
  neuronScore: number;
  status: EngineerStatus;
  joinedDate: string;
  flagCount: number;
  contracts: number;
}

export const MOCK_ADMIN_ENGINEERS: AdminEngineer[] = [
  { id: 'eng-1', name: 'Arjun Sharma',  email: 'arjun.sharma@example.com',  tier: 'Elite',        neuronScore: 920, status: 'active',         joinedDate: '2024-08-15', flagCount: 0, contracts: 8 },
  { id: 'eng-2', name: 'Priya Nair',    email: 'priya.nair@example.com',    tier: 'Professional', neuronScore: 845, status: 'active',         joinedDate: '2024-09-02', flagCount: 0, contracts: 5 },
  { id: 'eng-3', name: 'Rahul Verma',   email: 'rahul.verma@example.com',   tier: 'Verified',     neuronScore: 720, status: 'pending_review', joinedDate: '2024-11-20', flagCount: 2, contracts: 0 },
  { id: 'eng-4', name: 'Vikram Singh',  email: 'vikram.singh@example.com',  tier: 'Conditional',  neuronScore: 580, status: 'suspended',      joinedDate: '2024-10-10', flagCount: 5, contracts: 1 },
  { id: 'eng-5', name: 'Ananya Iyer',   email: 'ananya.iyer@example.com',   tier: 'Professional', neuronScore: 870, status: 'active',         joinedDate: '2024-09-18', flagCount: 0, contracts: 3 },
  { id: 'eng-6', name: 'Karan Mehta',   email: 'karan.mehta@example.com',   tier: 'Verified',     neuronScore: 760, status: 'active',         joinedDate: '2024-10-05', flagCount: 1, contracts: 2 },
];

// ─── Assessments ──────────────────────────────────────────────
export type AssessmentStatus = 'completed' | 'in_progress' | 'flagged';

export interface AdminAssessment {
  id: string;
  engineerName: string;
  engineerEmail: string;
  track: string;
  score: number | null;
  status: AssessmentStatus;
  flagCount: number;
  flagTypes: string[];
  completedAt: string | null;
  duration: number; // minutes
}

export const MOCK_ADMIN_ASSESSMENTS: AdminAssessment[] = [
  { id: 'asmt-1', engineerName: 'Arjun Sharma',  engineerEmail: 'arjun@example.com',  track: 'LLM Engineering',    score: 92, status: 'completed',   flagCount: 0, flagTypes: [],                                    completedAt: '2024-11-20', duration: 87 },
  { id: 'asmt-2', engineerName: 'Priya Nair',    engineerEmail: 'priya@example.com',  track: 'Computer Vision',    score: 87, status: 'completed',   flagCount: 0, flagTypes: [],                                    completedAt: '2024-11-19', duration: 92 },
  { id: 'asmt-3', engineerName: 'Vikram Singh',  engineerEmail: 'vikram@example.com', track: 'LLM Engineering',    score: 61, status: 'flagged',     flagCount: 5, flagTypes: ['tab_switch', 'copy_paste', 'idle'],  completedAt: '2024-11-18', duration: 45 },
  { id: 'asmt-4', engineerName: 'Rahul Verma',   engineerEmail: 'rahul@example.com',  track: 'MLOps',              score: null, status: 'in_progress', flagCount: 2, flagTypes: ['tab_switch'],                      completedAt: null,         duration: 0 },
  { id: 'asmt-5', engineerName: 'Karan Mehta',   engineerEmail: 'karan@example.com',  track: 'Data Engineering',   score: 78, status: 'flagged',     flagCount: 1, flagTypes: ['copy_paste'],                        completedAt: '2024-11-17', duration: 105 },
  { id: 'asmt-6', engineerName: 'Ananya Iyer',   engineerEmail: 'ananya@example.com', track: 'Computer Vision',    score: 95, status: 'completed',   flagCount: 0, flagTypes: [],                                    completedAt: '2024-11-16', duration: 78 },
];

// ─── Disputes ─────────────────────────────────────────────────
export type DisputeStatus = 'open' | 'under_review' | 'resolved';

export interface AdminDispute {
  id: string;
  contractTitle: string;
  contractValue: number;
  engineerName: string;
  companyName: string;
  reason: string;
  daysOpen: number;
  status: DisputeStatus;
  aiAuditSummary: string;
}

export const MOCK_ADMIN_DISPUTES: AdminDispute[] = [
  {
    id: 'disp-1',
    contractTitle: 'Voice AI Agent',
    contractValue: 150000,
    engineerName: 'Arjun Sharma',
    companyName: 'Sarvam AI',
    reason: 'Milestone 2 deliverables incomplete — TTS integration missing',
    daysOpen: 3,
    status: 'open',
    aiAuditSummary: 'Code review shows TTS module partially implemented (60%). Engineer submitted on deadline. Company claims full implementation was expected. Recommend 70/30 split in favor of engineer.',
  },
  {
    id: 'disp-2',
    contractTitle: 'MLOps Pipeline',
    contractValue: 120000,
    engineerName: 'Priya Nair',
    companyName: 'Zepto',
    reason: 'Deployment failed in production — engineer unresponsive for 5 days',
    daysOpen: 7,
    status: 'under_review',
    aiAuditSummary: 'Git history shows last commit 6 days ago. Deployment logs indicate environment mismatch (Python 3.9 vs 3.11). Engineer communication gap confirmed. Recommend 50/50 split with mediation.',
  },
  {
    id: 'disp-3',
    contractTitle: 'Data Pipeline',
    contractValue: 80000,
    engineerName: 'Karan Mehta',
    companyName: 'Razorpay',
    reason: 'Scope creep — company added requirements after contract signed',
    daysOpen: 1,
    status: 'open',
    aiAuditSummary: 'Contract review shows original scope did not include real-time streaming. Company added requirement in message thread on Day 12. Engineer has valid claim. Recommend full payment to engineer.',
  },
];

// ─── Moderation Queue ─────────────────────────────────────────
export type ModerationContentType = 'profile' | 'product' | 'review' | 'message';
export type ModerationFlag = 'spam' | 'inappropriate' | 'misleading' | 'hate_speech' | 'pii';
export type ModerationStatus = 'pending' | 'approved' | 'removed' | 'warned';

export interface ModerationItem {
  id: string;
  contentType: ModerationContentType;
  authorName: string;
  authorEmail: string;
  content: string;
  flags: ModerationFlag[];
  confidence: number; // 0-1
  flaggedAt: string;
  status: ModerationStatus;
}

export const MOCK_MODERATION_QUEUE: ModerationItem[] = [
  {
    id: 'mod-1',
    contentType: 'profile',
    authorName: 'Vikram Singh',
    authorEmail: 'vikram@example.com',
    content: 'Expert in all AI technologies. Guaranteed 10x ROI. Contact me directly at +91-9876543210 for special rates.',
    flags: ['spam', 'pii'],
    confidence: 0.94,
    flaggedAt: '2024-11-20',
    status: 'pending',
  },
  {
    id: 'mod-2',
    contentType: 'review',
    authorName: 'Anonymous Company',
    authorEmail: 'anon@company.com',
    content: 'This engineer is completely useless and a fraud. Do not hire under any circumstances.',
    flags: ['inappropriate', 'hate_speech'],
    confidence: 0.87,
    flaggedAt: '2024-11-19',
    status: 'pending',
  },
  {
    id: 'mod-3',
    contentType: 'product',
    authorName: 'Karan Mehta',
    authorEmail: 'karan@example.com',
    content: 'Ultimate AI Template Bundle — includes GPT-4 jailbreak prompts and unrestricted model access.',
    flags: ['inappropriate', 'misleading'],
    confidence: 0.91,
    flaggedAt: '2024-11-18',
    status: 'pending',
  },
  {
    id: 'mod-4',
    contentType: 'message',
    authorName: 'Unknown User',
    authorEmail: 'unknown@test.com',
    content: 'Let\'s move this conversation to WhatsApp: +91-9999999999. I can offer you a better deal outside the platform.',
    flags: ['spam', 'pii'],
    confidence: 0.98,
    flaggedAt: '2024-11-17',
    status: 'pending',
  },
];

// ─── Helpers ──────────────────────────────────────────────────
export function formatGMV(amount: number): string {
  if (amount >= 10_000_000) return `₹${(amount / 10_000_000).toFixed(1)}Cr`;
  if (amount >= 100_000) return `₹${(amount / 100_000).toFixed(1)}L`;
  if (amount >= 1_000) return `₹${(amount / 1_000).toFixed(0)}K`;
  return `₹${amount}`;
}

export function getActivityIcon(type: ActivityType): string {
  const icons: Record<ActivityType, string> = {
    signup: '👤',
    assessment_pass: '✅',
    payment: '💰',
    dispute: '⚠️',
    hire: '🤝',
    flag: '🚩',
  };
  return icons[type];
}

export function getActivityColor(type: ActivityType): string {
  const colors: Record<ActivityType, string> = {
    signup: 'text-accent-cyan',
    assessment_pass: 'text-accent-green',
    payment: 'text-accent-green',
    dispute: 'text-accent-red',
    hire: 'text-accent-violet',
    flag: 'text-accent-amber',
  };
  return colors[type];
}
