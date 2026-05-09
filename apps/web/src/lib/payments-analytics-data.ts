/**
 * Mock data for Payments, Analytics & Settings (Module 7).
 */

export type TransactionType = 'contract' | 'bounty' | 'marketplace' | 'payout' | 'refund' | 'escrow_deposit';
export type TransactionStatus = 'pending' | 'released' | 'paid' | 'refunded' | 'processing';
export type PayoutMethod = 'upi' | 'neft';
export type NotificationChannel = 'email' | 'push';

// ─── Wallet & Transactions ───────────────────────────────────
export interface WalletBalance {
  available: number;
  pending: number;
  thisMonthEarnings: number;
  currency: string;
}

export interface Transaction {
  id: string;
  date: string;
  type: TransactionType;
  description: string;
  amount: number;
  status: TransactionStatus;
  invoiceUrl?: string;
  contractId?: string;
  bountyId?: string;
}

export interface EarningsDataPoint {
  date: string;
  contracts: number;
  bounties: number;
  marketplace: number;
  total: number;
}

export const MOCK_WALLET_BALANCE: WalletBalance = {
  available: 245000,
  pending: 85000,
  thisMonthEarnings: 180000,
  currency: 'INR',
};

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 'txn-1',
    date: '2024-11-20',
    type: 'contract',
    description: 'Voice AI Agent - Milestone 1',
    amount: 50000,
    status: 'paid',
    invoiceUrl: '/invoices/txn-1.pdf',
    contractId: 'contract-1',
  },
  {
    id: 'txn-2',
    date: '2024-11-18',
    type: 'bounty',
    description: 'RAG System Optimization',
    amount: 25000,
    status: 'paid',
    invoiceUrl: '/invoices/txn-2.pdf',
    bountyId: 'bounty-1',
  },
  {
    id: 'txn-3',
    date: '2024-11-15',
    type: 'marketplace',
    description: 'LangChain Template Sale',
    amount: 5000,
    status: 'paid',
    invoiceUrl: '/invoices/txn-3.pdf',
  },
  {
    id: 'txn-4',
    date: '2024-11-12',
    type: 'payout',
    description: 'Withdrawal to UPI',
    amount: -100000,
    status: 'paid',
  },
  {
    id: 'txn-5',
    date: '2024-11-10',
    type: 'contract',
    description: 'Voice AI Agent - Milestone 2',
    amount: 50000,
    status: 'released',
    contractId: 'contract-1',
  },
  {
    id: 'txn-6',
    date: '2024-11-08',
    type: 'bounty',
    description: 'Fine-tuning Pipeline',
    amount: 35000,
    status: 'pending',
    bountyId: 'bounty-2',
  },
];

export const MOCK_EARNINGS_DATA: EarningsDataPoint[] = [
  { date: '2024-05', contracts: 120000, bounties: 45000, marketplace: 8000, total: 173000 },
  { date: '2024-06', contracts: 150000, bounties: 60000, marketplace: 12000, total: 222000 },
  { date: '2024-07', contracts: 180000, bounties: 55000, marketplace: 15000, total: 250000 },
  { date: '2024-08', contracts: 200000, bounties: 70000, marketplace: 18000, total: 288000 },
  { date: '2024-09', contracts: 175000, bounties: 65000, marketplace: 20000, total: 260000 },
  { date: '2024-10', contracts: 220000, bounties: 80000, marketplace: 25000, total: 325000 },
  { date: '2024-11', contracts: 150000, bounties: 60000, marketplace: 15000, total: 225000 },
];

// ─── Analytics ────────────────────────────────────────────────
export interface AnalyticsOverview {
  profileViews: number;
  profileViewsTrend: number; // percentage change
  proposalAcceptanceRate: number;
  avgResponseTime: string;
  neuronScore: number;
}

export interface ProfileViewDataPoint {
  date: string;
  views: number;
  event?: string; // Annotated event
}

export interface SearchKeyword {
  keyword: string;
  impressions: number;
  clickThroughRate: number;
}

export interface SkillDemand {
  skill: string;
  jobCount: number;
  avgRate: number; // For color gradient
}

export interface NeuronScoreHistoryPoint {
  date: string;
  score: number;
  event?: string;
}

export const MOCK_ANALYTICS_OVERVIEW: AnalyticsOverview = {
  profileViews: 1247,
  profileViewsTrend: 18.5,
  proposalAcceptanceRate: 68,
  avgResponseTime: '2.3 hours',
  neuronScore: 920,
};

export const MOCK_PROFILE_VIEWS: ProfileViewDataPoint[] = [
  { date: '2024-11-01', views: 32 },
  { date: '2024-11-02', views: 28 },
  { date: '2024-11-03', views: 35 },
  { date: '2024-11-04', views: 42 },
  { date: '2024-11-05', views: 38, event: 'Updated portfolio' },
  { date: '2024-11-06', views: 55 },
  { date: '2024-11-07', views: 48 },
  { date: '2024-11-08', views: 52 },
  { date: '2024-11-09', views: 45 },
  { date: '2024-11-10', views: 58 },
  { date: '2024-11-11', views: 62, event: 'Passed Elite tier' },
  { date: '2024-11-12', views: 75 },
  { date: '2024-11-13', views: 68 },
  { date: '2024-11-14', views: 72 },
  { date: '2024-11-15', views: 65 },
];

export const MOCK_SEARCH_KEYWORDS: SearchKeyword[] = [
  { keyword: 'LangChain', impressions: 342, clickThroughRate: 12.5 },
  { keyword: 'RAG Systems', impressions: 287, clickThroughRate: 15.2 },
  { keyword: 'PyTorch', impressions: 256, clickThroughRate: 9.8 },
  { keyword: 'FastAPI', impressions: 198, clickThroughRate: 11.1 },
  { keyword: 'LLM Fine-tuning', impressions: 176, clickThroughRate: 18.7 },
  { keyword: 'OpenAI', impressions: 165, clickThroughRate: 8.5 },
];

export const MOCK_SKILL_DEMAND: SkillDemand[] = [
  { skill: 'LangChain', jobCount: 45, avgRate: 4500 },
  { skill: 'PyTorch', jobCount: 38, avgRate: 4200 },
  { skill: 'RAG Systems', jobCount: 32, avgRate: 5000 },
  { skill: 'FastAPI', jobCount: 28, avgRate: 3800 },
  { skill: 'LLM Fine-tuning', jobCount: 25, avgRate: 5500 },
  { skill: 'OpenAI', jobCount: 22, avgRate: 4000 },
  { skill: 'HuggingFace', jobCount: 18, avgRate: 3500 },
];

export const MOCK_NEURON_SCORE_HISTORY: NeuronScoreHistoryPoint[] = [
  { date: '2024-08', score: 720 },
  { date: '2024-09', score: 765, event: 'Bounty won +45 pts' },
  { date: '2024-10', score: 780, event: '5-star review +15 pts' },
  { date: '2024-11', score: 920, event: 'Elite tier achieved +140 pts' },
];

// ─── Market Rates ─────────────────────────────────────────────
export interface MarketRate {
  skill: string;
  p10: number;
  p25: number;
  median: number;
  p75: number;
  p90: number;
  tierBreakdown: {
    tier: string;
    avgRate: number;
  }[];
  relatedSkills: string[];
}

export const MOCK_MARKET_RATES: Record<string, MarketRate> = {
  'LangChain': {
    skill: 'LangChain',
    p10: 2500,
    p25: 3500,
    median: 4500,
    p75: 5500,
    p90: 7000,
    tierBreakdown: [
      { tier: 'Conditional', avgRate: 2800 },
      { tier: 'Verified', avgRate: 3800 },
      { tier: 'Professional', avgRate: 4800 },
      { tier: 'Elite', avgRate: 6500 },
    ],
    relatedSkills: ['LlamaIndex', 'RAG Systems', 'OpenAI', 'Vector DBs'],
  },
  'PyTorch': {
    skill: 'PyTorch',
    p10: 2200,
    p25: 3200,
    median: 4200,
    p75: 5200,
    p90: 6500,
    tierBreakdown: [
      { tier: 'Conditional', avgRate: 2500 },
      { tier: 'Verified', avgRate: 3500 },
      { tier: 'Professional', avgRate: 4500 },
      { tier: 'Elite', avgRate: 6000 },
    ],
    relatedSkills: ['TensorFlow', 'JAX', 'ONNX', 'Model Optimization'],
  },
};

// ─── Company Billing ──────────────────────────────────────────
export interface CompanyPlan {
  name: string;
  monthlyCost: number;
  features: string[];
  isCurrentPlan: boolean;
}

export interface EscrowBreakdown {
  contractId: string;
  contractTitle: string;
  amount: number;
  status: string;
}

export const MOCK_COMPANY_PLAN: CompanyPlan = {
  name: 'Growth',
  monthlyCost: 9999,
  features: [
    'Up to 10 active contracts',
    'Unlimited job postings',
    'Priority support',
    'Advanced analytics',
    'Custom contract templates',
  ],
  isCurrentPlan: true,
};

export const MOCK_ESCROW_BREAKDOWN: EscrowBreakdown[] = [
  { contractId: 'contract-1', contractTitle: 'Voice AI Agent', amount: 100000, status: 'active' },
  { contractId: 'contract-2', contractTitle: 'MLOps Pipeline', amount: 75000, status: 'active' },
  { contractId: 'contract-3', contractTitle: 'Data Pipeline', amount: 50000, status: 'active' },
];

// ─── Settings ─────────────────────────────────────────────────
export interface NotificationPreferences {
  email: {
    newMessage: boolean;
    newBountyMatch: boolean;
    paymentReceived: boolean;
    contractUpdate: boolean;
  };
  push: {
    newMessage: boolean;
    newBountyMatch: boolean;
    paymentReceived: boolean;
    contractUpdate: boolean;
  };
}

export interface PrivacySettings {
  marketingEmails: boolean;
  aiRecommendations: boolean;
  publicActivityFeed: boolean;
}

export interface ActiveSession {
  id: string;
  device: string;
  browser: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

export const MOCK_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  email: {
    newMessage: true,
    newBountyMatch: true,
    paymentReceived: true,
    contractUpdate: true,
  },
  push: {
    newMessage: true,
    newBountyMatch: false,
    paymentReceived: true,
    contractUpdate: false,
  },
};

export const MOCK_PRIVACY_SETTINGS: PrivacySettings = {
  marketingEmails: false,
  aiRecommendations: true,
  publicActivityFeed: true,
};

export const MOCK_ACTIVE_SESSIONS: ActiveSession[] = [
  {
    id: 'session-1',
    device: 'MacBook Pro',
    browser: 'Chrome 120',
    location: 'Bangalore, India',
    lastActive: '2 minutes ago',
    isCurrent: true,
  },
  {
    id: 'session-2',
    device: 'iPhone 15',
    browser: 'Safari',
    location: 'Bangalore, India',
    lastActive: '3 hours ago',
    isCurrent: false,
  },
  {
    id: 'session-3',
    device: 'Windows PC',
    browser: 'Edge 120',
    location: 'Mumbai, India',
    lastActive: '2 days ago',
    isCurrent: false,
  },
];

// ─── Helpers ──────────────────────────────────────────────────
export function formatCurrency(amount: number, currency: string = 'INR'): string {
  // Use en-US grouping (1,00,000 → 100,000) for consistent display and test compatibility
  return `₹${Math.abs(amount).toLocaleString('en-US')}`;
}

export function getTransactionTypeColor(type: TransactionType): string {
  const colors: Record<TransactionType, string> = {
    contract: '#00D4FF',
    bounty: '#F59E0B',
    marketplace: '#7B5EA7',
    payout: '#10B981',
    refund: '#EF4444',
    escrow_deposit: '#00D4FF',
  };
  return colors[type];
}

export function getTransactionTypeBadgeVariant(type: TransactionType): 'cyan' | 'amber' | 'violet' | 'green' | 'red' {
  const variants: Record<TransactionType, 'cyan' | 'amber' | 'violet' | 'green' | 'red'> = {
    contract: 'cyan',
    bounty: 'amber',
    marketplace: 'violet',
    payout: 'green',
    refund: 'red',
    escrow_deposit: 'cyan',
  };
  return variants[type];
}

export function getStatusBadgeVariant(status: TransactionStatus): 'gray' | 'amber' | 'green' | 'red' | 'cyan' {
  const variants: Record<TransactionStatus, 'gray' | 'amber' | 'green' | 'red' | 'cyan'> = {
    pending: 'gray',
    released: 'amber',
    paid: 'green',
    refunded: 'red',
    processing: 'cyan',
  };
  return variants[status];
}

export function calculateTrend(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

export function formatTrend(trend: number): string {
  const sign = trend >= 0 ? '+' : '';
  return `${sign}${trend.toFixed(1)}%`;
}
