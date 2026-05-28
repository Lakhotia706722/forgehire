/**
 * React Query hooks for all API calls.
 * Every hook handles loading, error, and empty states.
 * Uses the existing apiClient from api.ts.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { useApiAuth } from '@/components/providers/api-auth-provider';
import { apiClient } from './api';

import { apiFetch, apiFetchList } from './api-fetch';
import { mapApiProductToListing } from './map-api-product';
import { EMPTY_PLATFORM_STATS } from './api-safe';

/** Wait for Clerk sign-in + Forge JWT sync before protected API queries. */
function useProtectedQueryEnabled(extra = true): boolean {
  const { isLoaded, isSignedIn } = useAuth();
  const { status: apiAuthStatus } = useApiAuth();
  return isLoaded && isSignedIn && apiAuthStatus === 'ready' && extra;
}

// ── Query Keys ────────────────────────────────────────────────
export const QUERY_KEYS = {
  platformStats:          ['stats', 'platform'],
  adminStats:             ['stats', 'admin'],
  adminRevenue:           (months: number) => ['stats', 'admin', 'revenue', months],
  adminActivity:          ['stats', 'admin', 'activity'],
  featuredEngineers:      ['featured', 'engineers'],
  featuredProducts:       ['featured', 'products'],
  featuredBounties:       ['featured', 'bounties'],
  engineerDashboard:      ['dashboard', 'engineer'],
  recommendedBounties:    ['dashboard', 'engineer', 'bounties'],
  engineerActivity:       ['dashboard', 'engineer', 'activity'],
  companyDashboard:       ['dashboard', 'company'],
  pendingSubmissions:     ['dashboard', 'company', 'submissions'],
  wallet:                 ['wallet'],
  walletTransactions:     (cursor?: string) => ['wallet', 'transactions', cursor],
  earningsChart:          (period: string) => ['wallet', 'earnings', period],
  engineerProfile:        (id: string) => ['engineer', 'profile', id],
  companyProfile:         (id: string) => ['company', 'profile', id],
  tasks:                  (filters: Record<string, any>) => ['tasks', filters],
  task:                   (id: string) => ['task', id],
  taskSubmissions:        (taskId: string) => ['task', taskId, 'submissions'],
  taskSubmission:         (taskId: string, sid: string) => ['task', taskId, 'submission', sid],
  products:               (filters: Record<string, any>) => ['products', filters],
  product:                (id: string) => ['product', id],
  productReviews:         (id: string) => ['product', id, 'reviews'],
  contracts:              ['contracts'],
  contract:               (id: string) => ['contract', id],
  messages:               ['messages'],
  conversation:           (id: string) => ['conversation', id],
  adminEngineers:         (filters: Record<string, any>) => ['admin', 'engineers', filters],
  adminEngineer:          (id: string) => ['admin', 'engineer', id],
  adminAssessments:       (filters: Record<string, any>) => ['admin', 'assessments', filters],
  adminAssessment:        (id: string) => ['admin', 'assessment', id],
  adminDisputes:          ['admin', 'disputes'],
  adminModeration:        ['admin', 'moderation'],
  adminProduct:           (id: string) => ['admin', 'product', id],
  engineerAnalytics:      ['analytics', 'engineer'],
  companyAnalytics:       ['analytics', 'company'],
  neuronScoreHistory:     ['neuron-score', 'history'],
  settings:               ['settings'],
  sessions:               ['settings', 'sessions'],
};

// ── Platform Stats (Landing Page) ────────────────────────────
export interface PlatformStats {
  totalEngineers: number;
  verifiedEngineers: number;
  activeEngineers: number;
  totalCompanies: number;
  activeContracts: number;
  completedContracts: number;
  totalBounties: number;
  activeBounties: number;
  totalPaidOut: number;
}

export function usePlatformStats() {
  return useQuery<PlatformStats>({
    queryKey: QUERY_KEYS.platformStats,
    queryFn: async () => {
      try {
        return await apiFetch<PlatformStats>('/api/stats/platform');
      } catch {
        return { ...EMPTY_PLATFORM_STATS };
      }
    },
    staleTime: 5 * 60_000, // 5 minutes
  });
}

// ── Featured Engineers (Landing Page) ────────────────────────
export interface FeaturedEngineer {
  id: string;
  name: string;
  headline: string;
  location: string;
  neuronScore: number;
  neuronTier: string;
  hourlyRate: number;
  availabilityStatus: string;
  skills: string[];
  rating: number;
  reviewCount: number;
  completedProjects: number;
  productsPublished: number;
}

export function useFeaturedEngineers() {
  return useQuery<FeaturedEngineer[]>({
    queryKey: QUERY_KEYS.featuredEngineers,
    queryFn: () => apiFetchList<FeaturedEngineer>('/api/featured/engineers'),
    staleTime: 10 * 60_000, // 10 minutes
  });
}

// ── Featured Products (Landing Page) ─────────────────────────
export interface FeaturedProduct {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  category: string;
  thumbnailUrl: string;
  priceINR: number;
  pricingModel: string;
  rating: number;
  reviewCount: number;
  purchaseCount: number;
  engineer: { name: string; neuronScore: number; tier: string };
}

export function useFeaturedProducts() {
  return useQuery<FeaturedProduct[]>({
    queryKey: QUERY_KEYS.featuredProducts,
    queryFn: () => apiFetchList<FeaturedProduct>('/api/featured/products'),
    staleTime: 10 * 60_000,
  });
}

// ── Featured Bounties (Landing Page) ─────────────────────────
export interface FeaturedBounty {
  id: string;
  title: string;
  type: string;
  category: string[];
  rewardAmount: number;
  difficulty: string;
  minNeuronScore: number;
  participantCount: number;
  daysLeft: number | null;
  company: { name: string; logoUrl: string | null; trustScore: number };
}

export function useFeaturedBounties() {
  return useQuery<FeaturedBounty[]>({
    queryKey: QUERY_KEYS.featuredBounties,
    queryFn: () => apiFetchList<FeaturedBounty>('/api/featured/bounties'),
    staleTime: 10 * 60_000,
  });
}

// ── Engineer Dashboard ────────────────────────────────────────
export interface EngineerDashboardStats {
  profile?: {
    name: string;
    photo: string | null;
    neuronScore: number;
    tier: string;
    completeness: number;
  };
  stats?: {
    profileViews30d: number;
    proposalsSent: number;
    acceptanceRate: number;
    bountiesWon: number;
    totalEarnings: number;
  };
  recommendedBounties?: Array<{
    id: string;
    title: string;
    rewardAmount: number;
    deadline: string | null;
    difficulty: string;
    company: { name: string; logoUrl: string | null };
    minNeuronScore: number;
    participantCount: number;
    techRequirements: string[];
  }>;
  recentActivity?: ActivityItem[];
  pendingPayments?: number;
  activeContractsCount?: number;
  notifications?: Array<{
    id: string;
    type: string;
    title: string;
    count: number;
  }>;
  activeContracts: { count: number; trend: number };
  pendingProposals: { count: number; trend: number };
  marketplaceRevenue: { amount: number; trend: number };
  unreadMessages: { count: number };
  walletBalance: number;
}

export function useEngineerDashboard() {
  const authReady = useProtectedQueryEnabled();
  return useQuery<EngineerDashboardStats>({
    queryKey: QUERY_KEYS.engineerDashboard,
    queryFn: () => apiFetch('/api/dashboard/engineer'),
    staleTime: 60_000, // 1 minute
    enabled: authReady,
  });
}

// ── Recommended Bounties ──────────────────────────────────────
export interface RecommendedBounty {
  id: string;
  title: string;
  type: string;
  category: string[];
  rewardAmount: number;
  difficulty: string;
  minNeuronScore: number;
  participantCount: number;
  daysLeft: number | null;
  matchPercentage: number;
  matchingSkills: string[];
  company: { name: string; logoUrl: string | null; trustScore: number };
}

export function useRecommendedBounties(limit = 10) {
  const authReady = useProtectedQueryEnabled();
  return useQuery<RecommendedBounty[]>({
    queryKey: QUERY_KEYS.recommendedBounties,
    queryFn: () => apiFetch(`/api/dashboard/engineer/recommended-bounties?limit=${limit}`),
    staleTime: 2 * 60_000,
    enabled: authReady,
  });
}

// ── Engineer Activity Feed ────────────────────────────────────
export interface ActivityItem {
  id: string;
  type: string;
  message: string;
  timestamp: string;
}

export function useEngineerActivity(limit = 10) {
  const authReady = useProtectedQueryEnabled();
  return useQuery<ActivityItem[]>({
    queryKey: QUERY_KEYS.engineerActivity,
    queryFn: () => apiFetch(`/api/dashboard/engineer/activity?limit=${limit}`),
    staleTime: 30_000, // 30 seconds
    refetchInterval: authReady ? 60_000 : false,
    enabled: authReady,
  });
}

// ── Company Dashboard ─────────────────────────────────────────
export interface CompanyDashboardStats {
  activeTasksPosted: number;
  totalEngineersHired: number;
  totalSpendThisMonth: number;
  openDisputes: number;
  profile?: {
    name: string;
    logo: string | null;
    trustScore: number;
    verificationStatus: string;
  };
  stats?: {
    activeTasksCount: number;
    totalSpend: number;
    engineersHired: number;
    avgRating: number;
    pendingSubmissions: number;
  };
  recommendedEngineers?: Array<{
    id: string;
    fullName: string;
    headline: string | null;
    neuronScore: number;
    neuronTier: string;
    hourlyRate: number;
    availabilityStatus: string;
  }>;
  recentActivity?: Array<{
    id: string;
    type: string;
    message: string;
    timestamp: string;
  }>;
  activeContracts?: Array<{
    id: string;
    title: string;
    status: string;
    totalAmount: number;
    createdAt: string;
  }> | { count: number; trend: number };
  walletBalance?: number;
}

export function useCompanyDashboard() {
  const authReady = useProtectedQueryEnabled();
  return useQuery<CompanyDashboardStats>({
    queryKey: QUERY_KEYS.companyDashboard,
    queryFn: () => apiFetch('/api/dashboard/company'),
    staleTime: 60_000,
    enabled: authReady,
  });
}

// ── Pending Submissions ───────────────────────────────────────
export interface PendingSubmission {
  id: string;
  taskId: string;
  taskTitle: string;
  engineerName: string;
  engineerScore: number;
  submittedAt: string;
  demoUrl: string | null;
  githubUrl: string | null;
}

export function usePendingSubmissions(limit = 10) {
  const authReady = useProtectedQueryEnabled();
  return useQuery<PendingSubmission[]>({
    queryKey: QUERY_KEYS.pendingSubmissions,
    queryFn: () => apiFetch(`/api/dashboard/company/pending-submissions?limit=${limit}`),
    staleTime: 60_000,
    enabled: authReady,
  });
}

// ── Admin Stats ───────────────────────────────────────────────
export interface AdminStats {
  totalEngineers: number;
  totalCompanies: number;
  activeContracts: number;
  gmvToday: number;
  gmvThisWeek: number;
  gmvThisMonth: number;
  assessmentPassRate: number;
  platformFeeToday: number;
  platformFeeThisWeek: number;
  platformFeeThisMonth: number;
  pendingDisputes: number;
  flaggedAssessments: number;
  moderationQueue: number;
}

export function useAdminStats() {
  const authReady = useProtectedQueryEnabled();
  return useQuery<AdminStats>({
    queryKey: QUERY_KEYS.adminStats,
    queryFn: () => apiFetch('/api/stats/admin'),
    staleTime: 60_000,
    refetchInterval: authReady ? 60_000 : false,
    enabled: authReady,
  });
}

// ── Admin Revenue Chart ───────────────────────────────────────
export interface RevenueDataPoint {
  date: string;
  contracts: number;
  bounties: number;
  marketplace: number;
  total: number;
}

export function useAdminRevenue(months = 6) {
  const authReady = useProtectedQueryEnabled();
  return useQuery<RevenueDataPoint[]>({
    queryKey: QUERY_KEYS.adminRevenue(months),
    queryFn: () => apiFetch(`/api/stats/admin/revenue?months=${months}`),
    staleTime: 60 * 60_000, // 1 hour
    enabled: authReady,
  });
}

// ── Admin Activity Feed ───────────────────────────────────────
export function useAdminActivity(limit = 20) {
  const authReady = useProtectedQueryEnabled();
  return useQuery<ActivityItem[]>({
    queryKey: QUERY_KEYS.adminActivity,
    queryFn: () => apiFetch(`/api/stats/admin/activity?limit=${limit}`),
    staleTime: 30_000,
    refetchInterval: authReady ? 30_000 : false,
    enabled: authReady,
  });
}

// ── Wallet ────────────────────────────────────────────────────
export interface WalletData {
  balance: number;
  pendingRelease: number;
  thisMonthEarnings: number;
  currency: string;
  totalEarned: number;
  totalWithdrawn: number;
  kycStatus?: string;
  panVerified?: boolean;
  requiresKycForWithdrawal?: boolean;
  kycThreshold?: number;
  minimumPayout?: number;
}

export function useWallet() {
  const authReady = useProtectedQueryEnabled();
  return useQuery<WalletData>({
    queryKey: QUERY_KEYS.wallet,
    queryFn: () => apiFetch('/api/payments/wallet'),
    staleTime: 30_000,
    enabled: authReady,
  });
}

// ── Wallet Transactions ───────────────────────────────────────
export interface WalletTransaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
  balanceBefore: number;
  balanceAfter: number;
}

export function useWalletTransactions(cursor?: string, limit = 20) {
  const authReady = useProtectedQueryEnabled();
  return useQuery<{ transactions: WalletTransaction[]; nextCursor: string | null }>({
    queryKey: QUERY_KEYS.walletTransactions(cursor),
    queryFn: () => apiFetch(`/api/payments/wallet/transactions?limit=${limit}${cursor ? `&cursor=${cursor}` : ''}`),
    staleTime: 30_000,
    enabled: authReady,
  });
}

// ── Earnings Chart ────────────────────────────────────────────
export interface EarningsDataPoint {
  date: string;
  contracts: number;
  bounties: number;
  marketplace: number;
  total: number;
}

export function useEarningsChart(period: '30days' | '6months' | 'year' = '6months') {
  const authReady = useProtectedQueryEnabled();
  return useQuery<EarningsDataPoint[]>({
    queryKey: QUERY_KEYS.earningsChart(period),
    queryFn: () => apiFetch(`/api/payments/wallet/earnings?period=${period}`),
    staleTime: 5 * 60_000,
    enabled: authReady,
  });
}

// ── Task Submissions (Company) ────────────────────────────────
export interface TaskSubmission {
  id: string;
  engineerName: string;
  engineerProfileId: string;
  neuronScore: number;
  score: number | null;
  status: string;
  submittedAt: string;
  demoUrl: string | null;
  githubUrl: string | null;
}

export function useTaskSubmissions(taskId: string) {
  const authReady = useProtectedQueryEnabled(!!taskId);
  return useQuery<TaskSubmission[]>({
    queryKey: QUERY_KEYS.taskSubmissions(taskId),
    queryFn: () => apiFetch(`/api/tasks/${taskId}/submissions`),
    staleTime: 30_000,
    enabled: authReady,
  });
}

// ── Single Submission ─────────────────────────────────────────
export interface SubmissionDetail {
  id: string;
  taskId: string;
  engineerName: string;
  engineerProfileId: string;
  neuronScore: number;
  score: number | null;
  status: string;
  submittedAt: string;
  description: string;
  demoUrl: string | null;
  githubUrl: string | null;
  videoUrl?: string | null;
  architectureDiagram?: string | null;
  performanceMetrics: { metric: string; value: string }[] | null;
  screenshots: string[];
  feedback?: string | null;
  criteriaScores?: Record<string, number> | null;
}

export function useSubmissionDetail(taskId: string, submissionId: string) {
  const authReady = useProtectedQueryEnabled(!!taskId && !!submissionId);
  return useQuery<SubmissionDetail>({
    queryKey: QUERY_KEYS.taskSubmission(taskId, submissionId),
    queryFn: () => apiFetch(`/api/tasks/${taskId}/submissions/${submissionId}`),
    staleTime: 30_000,
    enabled: authReady,
  });
}

// ── Admin Engineer Detail ─────────────────────────────────────
export interface AdminEngineerDetail {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  neuronScore: number;
  neuronTier: string;
  completenessScore: number;
  availabilityStatus: string;
  location: string | null;
  hourlyRate: number | null;
  yearsOfExperience: number | null;
  kycVerified: boolean;
  createdAt: string;
  assessmentCount: number;
  contractCount: number;
  productCount: number;
  skills: string[];
  flagged: boolean;
}

export function useAdminEngineerDetail(id: string) {
  const authReady = useProtectedQueryEnabled(!!id);
  return useQuery<AdminEngineerDetail>({
    queryKey: QUERY_KEYS.adminEngineer(id),
    queryFn: () => apiFetch(`/api/admin/engineers/${id}`),
    staleTime: 60_000,
    enabled: authReady,
  });
}

// ── Admin Assessment Detail ───────────────────────────────────
export interface AdminAssessmentDetail {
  id: string;
  engineerName: string;
  email: string;
  overallScore: number | null;
  tier: string | null;
  status: string;
  flagged: boolean;
  plagiarismFlagged: boolean;
  tabSwitches: number;
  focusLosses: number;
  pasteAttempts: number;
  mcqScore: number | null;
  codingScore: number | null;
  caseScore: number | null;
  dimensions: {
    modelKnowledge: number | null;
    engineeringDepth: number | null;
    systemDesign: number | null;
    codingQuality: number | null;
    practicalApp: number | null;
    communication: number | null;
  };
  evaluatedAt: string | null;
}

export function useAdminAssessmentDetail(id: string) {
  const authReady = useProtectedQueryEnabled(!!id);
  return useQuery<AdminAssessmentDetail>({
    queryKey: QUERY_KEYS.adminAssessment(id),
    queryFn: () => apiFetch(`/api/admin/assessments/${id}`),
    staleTime: 60_000,
    enabled: authReady,
  });
}

// ── Admin Product Detail ──────────────────────────────────────
export interface AdminProductDetail {
  id: string;
  name: string;
  tagline: string;
  category: string;
  status: string;
  priceINR: number;
  engineerName: string;
  engineerProfileId: string;
  description: string;
  techStack: string[];
  demoUrl: string;
  submittedAt: string;
  moderationNotes: string | null;
}

export function useAdminProductDetail(id: string) {
  const authReady = useProtectedQueryEnabled(!!id);
  return useQuery<AdminProductDetail>({
    queryKey: QUERY_KEYS.adminProduct(id),
    queryFn: () => apiFetch(`/api/admin/products/${id}`),
    staleTime: 60_000,
    enabled: authReady,
  });
}

// ── Engineer Settings ─────────────────────────────────────────
export interface EngineerSettings {
  profile: {
    fullName: string;
    headline: string;
    bio: string;
    email: string;
  };
  notifications: {
    email: { newMessage: boolean; newBountyMatch: boolean; paymentReceived: boolean; contractUpdate: boolean };
    push: { newMessage: boolean; newBountyMatch: boolean; paymentReceived: boolean; contractUpdate: boolean };
  };
  privacy: {
    marketingEmails: boolean;
    aiRecommendations: boolean;
    publicActivityFeed: boolean;
  };
}

export function useEngineerSettings() {
  const authReady = useProtectedQueryEnabled();
  return useQuery<EngineerSettings>({
    queryKey: QUERY_KEYS.settings,
    queryFn: () => apiFetch('/api/engineer/settings'),
    staleTime: 5 * 60_000,
    enabled: authReady,
  });
}

// ── Active Sessions ───────────────────────────────────────────
export interface ActiveSession {
  id: string;
  device: string;
  browser: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

export function useActiveSessions() {
  const authReady = useProtectedQueryEnabled();
  return useQuery<ActiveSession[]>({
    queryKey: QUERY_KEYS.sessions,
    queryFn: () => apiFetch('/api/auth/sessions'),
    staleTime: 60_000,
    enabled: authReady,
  });
}

// ── NeuronScore History ───────────────────────────────────────
export interface ScoreHistoryPoint {
  date: string;
  score: number;
  reason: string;
  delta: number;
}

export function useNeuronScoreHistory() {
  const authReady = useProtectedQueryEnabled();
  return useQuery<ScoreHistoryPoint[]>({
    queryKey: QUERY_KEYS.neuronScoreHistory,
    queryFn: () => apiFetch('/api/neuron-score/history'),
    staleTime: 5 * 60_000,
    enabled: authReady,
  });
}

// ── Mutations ─────────────────────────────────────────────────

export function useApproveSubmission(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (submissionId: string) =>
      apiFetch(`/api/tasks/${taskId}/submissions/${submissionId}/approve`, { method: 'POST' }),
    onSuccess: (_data, submissionId) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.taskSubmissions(taskId) });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.taskSubmission(taskId, submissionId) });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.task(taskId) });
      qc.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useRejectSubmission(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ submissionId, feedback }: { submissionId: string; feedback: string }) =>
      apiFetch(`/api/tasks/${taskId}/submissions/${submissionId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ feedback }),
      }),
    onSuccess: (_data, { submissionId }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.taskSubmissions(taskId) });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.taskSubmission(taskId, submissionId) });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.task(taskId) });
      qc.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useEvaluateSubmission(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      submissionId,
      score,
      feedback,
      criteriaScores,
    }: {
      submissionId: string;
      score: number;
      feedback: string;
      criteriaScores?: Record<string, number>;
    }) =>
      apiFetch(`/api/tasks/${taskId}/submissions/${submissionId}/evaluate`, {
        method: 'POST',
        body: JSON.stringify({ submissionId, score, feedback, criteriaScores }),
      }),
    onSuccess: (_data, { submissionId }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.taskSubmissions(taskId) });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.taskSubmission(taskId, submissionId) });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.task(taskId) });
      qc.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useAdminScoreOverride() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ engineerId, score, reason }: { engineerId: string; score: number; reason: string }) =>
      apiFetch(`/api/admin/engineers/${engineerId}/score-override`, {
        method: 'POST',
        body: JSON.stringify({ score, reason }),
      }),
    onSuccess: (_data, { engineerId }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.adminEngineer(engineerId) });
    },
  });
}

export function useAdminSuspendEngineer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (engineerId: string) =>
      apiFetch(`/api/admin/engineers/${engineerId}/suspend`, { method: 'POST' }),
    onSuccess: (_data, engineerId) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.adminEngineer(engineerId) });
    },
  });
}

export function useAdminAssessmentDecision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ assessmentId, decision, notes }: { assessmentId: string; decision: string; notes: string }) =>
      apiFetch(`/api/admin/assessments/${assessmentId}/decision`, {
        method: 'POST',
        body: JSON.stringify({ decision, notes }),
      }),
    onSuccess: (_data, { assessmentId }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.adminAssessment(assessmentId) });
    },
  });
}

export function useAdminProductDecision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, decision, notes }: { productId: string; decision: string; notes: string }) =>
      apiFetch(`/api/admin/products/${productId}/decision`, {
        method: 'POST',
        body: JSON.stringify({ decision, notes }),
      }),
    onSuccess: (_data, { productId }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.adminProduct(productId) });
    },
  });
}

export function useWithdraw() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      amount: number;
      method: 'upi' | 'neft' | 'imps';
      upiId?: string;
      accountNumber?: string;
      ifscCode?: string;
      accountHolderName?: string;
    }) =>
      apiFetch('/api/payments/payout', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.wallet });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.walletTransactions() });
    },
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<EngineerSettings>) =>
      apiFetch('/api/engineer/settings', {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.settings });
    },
  });
}

export function useRevokeSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) =>
      apiFetch(`/api/auth/sessions/${sessionId}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.sessions });
    },
  });
}

// ── Engineer Profile ──────────────────────────────────────────
export interface EngineerSkill {
  id: string;
  skillName: string;
  proficiencyLevel: string;
}

export interface EngineerProfileData {
  id: string;
  fullName: string;
  headline?: string | null;
  bio: string | null;
  location: string | null;
  hourlyRate: number | string | null;
  availabilityStatus: string;
  neuronScore: number;
  neuronTier: string;
  completenessScore: number;
  githubUrl: string | null;
  linkedinUrl: string | null;
  portfolioUrl: string | null;
  upiId: string | null;
  updatedAt?: string;
  completeness?: { score: number };
  skills?: EngineerSkill[];
}

export function useMyEngineerProfile() {
  const authReady = useProtectedQueryEnabled();
  return useQuery<EngineerProfileData | null>({
    queryKey: ['engineer', 'me'],
    queryFn: () => apiFetch<EngineerProfileData | null>('/api/engineer/profile'),
    staleTime: 5 * 60_000,
    enabled: authReady,
    retry: (failureCount, err) => {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('401') && failureCount < 3) return true;
      return failureCount < 1;
    },
    retryDelay: 800,
  });
}

export function useUpdateEngineerProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetch<EngineerProfileData>('/api/engineer/profile', {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    onSuccess: (updated) => {
      qc.setQueryData(['engineer', 'me'], updated);
      qc.invalidateQueries({ queryKey: QUERY_KEYS.settings });
    },
  });
}

// ── Contracts ─────────────────────────────────────────────────
export interface ContractSummary {
  id: string;
  title: string;
  status: string;
  companyName: string;
  companyLogoUrl: string | null;
  totalAmount: number;
  escrowReleased: number;
  startDate: string;
  endDate: string | null;
  hiringMode: string;
}

export function useMyContracts(filter?: string) {
  const authReady = useProtectedQueryEnabled();
  const params = filter && filter !== 'all' ? `?status=${filter}` : '';
  return useQuery<ContractSummary[]>({
    queryKey: ['contracts', 'me', filter],
    queryFn: () => apiFetch(`/api/contracts${params}`),
    staleTime: 60_000,
    enabled: authReady,
  });
}

// ── Company Tasks ───────────────────────────────────────────────
export interface CompanyTaskItem {
  id: string;
  title: string;
  type: string;
  status: string;
  rewardAmount: number;
  deadline: string;
  participantCount: number;
  submissionCount: number;
  difficulty: string;
  ndaRequired?: boolean;
  problemStatement?: string;
  expectedOutcome?: string;
  techRequirements?: string[];
  minNeuronScore?: number;
}

export function useCompanyTasks(status?: string) {
  const authReady = useProtectedQueryEnabled();
  const params = status && status !== 'all' ? `?status=${status}` : '';
  return useQuery<CompanyTaskItem[]>({
    queryKey: QUERY_KEYS.tasks({ mine: true, status }),
    queryFn: () => apiFetchList<CompanyTaskItem>(`/api/tasks/mine${params}`),
    staleTime: 60_000,
    enabled: authReady,
  });
}

export function useTaskDetail(taskId: string) {
  const authReady = useProtectedQueryEnabled(!!taskId);
  return useQuery<CompanyTaskItem>({
    queryKey: QUERY_KEYS.task(taskId),
    queryFn: () => apiFetch(`/api/tasks/${taskId}`),
    staleTime: 30_000,
    enabled: authReady,
  });
}

export function useSubmitTask(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetch(`/api/tasks/${taskId}/submit`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.task(taskId) });
      qc.invalidateQueries({ queryKey: ['tasks', 'my-submissions'] });
    },
  });
}

// ── Company Analytics ───────────────────────────────────────────
export interface CompanyAnalyticsData {
  summary: {
    totalJobsPosted: number;
    totalApplications: number;
    totalHires: number;
    avgTimeToHire: string;
    totalSpent: number;
    costPerHire: string;
  };
  trends: {
    jobsPosted: { date: string; value: number }[];
    applications: { date: string; value: number }[];
    hires: { date: string; value: number }[];
    spending: { date: string; value: number }[];
  };
}

export function useCompanyAnalytics() {
  const authReady = useProtectedQueryEnabled();
  return useQuery<CompanyAnalyticsData>({
    queryKey: QUERY_KEYS.companyAnalytics,
    queryFn: () => apiFetch('/api/analytics/company/me'),
    staleTime: 5 * 60_000,
    enabled: authReady,
  });
}

// ── Market Rates (public) ─────────────────────────────────────
export interface MarketRateSkill {
  skill: string;
  p10: number;
  p25: number;
  median: number;
  p75: number;
  p90: number;
  sampleSize: number;
  tierBreakdown: { tier: string; avgRate: number }[];
  relatedSkills: string[];
}

export function useMarketRates() {
  return useQuery<{ bySkill: MarketRateSkill[] }>({
    queryKey: ['analytics', 'market-rates'],
    queryFn: async () => {
      try {
        const data = await apiFetch<{ bySkill?: MarketRateSkill[] } | MarketRateSkill[]>(
          '/api/analytics/market-rates',
        );
        const bySkill = Array.isArray(data) ? data : (data?.bySkill ?? []);
        return { bySkill };
      } catch {
        return { bySkill: [] };
      }
    },
    staleTime: 60 * 60_000,
  });
}

export interface ContractDetail {
  id: string;
  title: string;
  scope: string;
  status: string;
  hiringMode: string;
  companyName: string;
  companyLogoUrl: string | null;
  engineerName: string;
  totalAmount: number;
  hourlyRate: number | null;
  startDate: string;
  endDate: string | null;
  milestones: {
    id: string;
    milestoneNumber: number;
    title: string;
    description: string;
    amount: number;
    status: string;
    dueDate: string | null;
    submittedAt: string | null;
    approvedAt: string | null;
    paidAt: string | null;
  }[];
  finalContractUrl: string | null;
}

export function useContractDetail(id: string) {
  const authReady = useProtectedQueryEnabled(!!id);
  return useQuery<ContractDetail>({
    queryKey: ['contract', id],
    queryFn: () => apiFetch(`/api/contracts/${id}`),
    staleTime: 30_000,
    enabled: authReady,
  });
}

export function useSubmitContractMilestone(contractId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      milestoneId: string;
      deliverables?: string[] | null;
      notes?: string | null;
    }) =>
      apiFetch(`/api/contracts/${contractId}/milestone/${payload.milestoneId}/submit`, {
        method: 'POST',
        body: JSON.stringify({
          deliverables: payload.deliverables ?? [],
          notes: payload.notes ?? '',
        }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contract', contractId] });
      qc.invalidateQueries({ queryKey: ['contracts', 'me'] });
    },
  });
}

export function useApproveContractMilestone(contractId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (milestoneId: string) =>
      apiFetch(`/api/contracts/${contractId}/milestone/${milestoneId}/approve`, {
        method: 'POST',
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contract', contractId] });
      qc.invalidateQueries({ queryKey: ['contracts', 'me'] });
    },
  });
}

export function useRaiseContractDispute(contractId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { reason: string; evidence?: Record<string, unknown> | null }) =>
      apiFetch(`/api/contracts/${contractId}/dispute`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contract', contractId] });
      qc.invalidateQueries({ queryKey: ['contracts', 'me'] });
    },
  });
}

// ── Conversations ─────────────────────────────────────────────
export interface ConversationSummary {
  id: string;
  otherUserId: string;
  otherUserName: string;
  otherUserRole: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export function useConversations() {
  const authReady = useProtectedQueryEnabled();
  return useQuery<ConversationSummary[]>({
    queryKey: ['conversations'],
    queryFn: () => apiFetch('/api/messages/conversations'),
    staleTime: 30_000,
    refetchInterval: authReady ? 30_000 : false,
    enabled: authReady,
  });
}

export interface MessageItem {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  readAt: string | null;
  fileUrl: string | null;
  fileName: string | null;
}

export function useMessages(conversationId: string) {
  const authReady = useProtectedQueryEnabled(!!conversationId);
  return useQuery<MessageItem[]>({
    queryKey: ['messages', conversationId],
    queryFn: () => apiFetch(`/api/messages/conversations/${conversationId}/messages`),
    staleTime: 10_000,
    refetchInterval: authReady ? 15_000 : false,
    enabled: authReady,
  });
}

// ── Notifications ─────────────────────────────────────────────
export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  href: string | null;
}

export function useNotifications() {
  const authReady = useProtectedQueryEnabled();
  return useQuery<NotificationItem[]>({
    queryKey: ['notifications'],
    queryFn: () => apiFetch('/api/notifications'),
    staleTime: 30_000,
    refetchInterval: authReady ? 60_000 : false,
    enabled: authReady,
  });
}

// ── NeuronScore ───────────────────────────────────────────────
export interface NeuronScoreData {
  score: number;
  tier: string;
  breakdown: {
    assessment: number;
    clientRatings: number;
    portfolioDepth: number;
    workDelivery: number;
    marketplace: number;
    community: number;
  };
  history: { date: string; score: number; event?: string }[];
}

export function useNeuronScore() {
  const authReady = useProtectedQueryEnabled();
  return useQuery<NeuronScoreData>({
    queryKey: ['neuron-score', 'me'],
    queryFn: () => apiFetch('/api/neuron-score/me'),
    staleTime: 5 * 60_000,
    enabled: authReady,
  });
}

// ── My Products ───────────────────────────────────────────────
export interface MyProduct {
  id: string;
  name: string;
  slug: string;
  category: string;
  status: string;
  priceINR: number;
  pricingModel: string;
  purchaseCount: number;
  rating: number | null;
  reviewCount: number;
  revenue: number;
  publishedAt: string | null;
}

export function useMyProducts() {
  const authReady = useProtectedQueryEnabled();
  return useQuery<MyProduct[]>({
    queryKey: ['products', 'me'],
    queryFn: () => apiFetchList<MyProduct>('/api/products/me'),
    staleTime: 60_000,
    enabled: authReady,
  });
}

export function useMarketplaceCatalog(params?: {
  limit?: number;
  query?: string;
}) {
  return useQuery({
    queryKey: ['products', 'catalog', params],
    queryFn: async () => {
      const q = new URLSearchParams();
      q.set('status', 'published');
      q.set('limit', String(params?.limit ?? 50));
      if (params?.query) q.set('query', params.query);
      const items = await apiFetchList<Record<string, unknown>>(`/api/products?${q.toString()}`);
      return items.map((item, i) => mapApiProductToListing(item, i));
    },
    staleTime: 60_000,
  });
}

export function useTrendingProducts(limit = 6) {
  return useQuery({
    queryKey: ['products', 'trending', limit],
    queryFn: async () => {
      const items = await apiFetchList<Record<string, unknown>>(
        `/api/products/trending?limit=${limit}`,
      );
      return items.map((item, i) => mapApiProductToListing(item, i));
    },
    staleTime: 120_000,
  });
}

// ── My Purchases ──────────────────────────────────────────────
export interface MyPurchase {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  engineerName: string;
  priceINR: number;
  licenseKey: string;
  purchasedAt: string;
  status: string;
}

export function useMyPurchases() {
  const authReady = useProtectedQueryEnabled();
  return useQuery<MyPurchase[]>({
    queryKey: ['purchases', 'me'],
    queryFn: () => apiFetchList<MyPurchase>('/api/products/purchases/me'),
    staleTime: 60_000,
    enabled: authReady,
  });
}

// ── Product Analytics ─────────────────────────────────────────
export interface ProductAnalyticsData {
  productId: string;
  productName: string;
  revenue: { date: string; revenue: number; sales: number }[];
  funnel: { views: number; demoClicks: number; purchases: number };
  ratingTrend: { date: string; rating: number }[];
  topIndustries: { industry: string; count: number }[];
}

export function useProductAnalytics(productId: string) {
  const authReady = useProtectedQueryEnabled(!!productId);
  return useQuery<ProductAnalyticsData>({
    queryKey: ['product', productId, 'analytics'],
    queryFn: () => apiFetch(`/api/products/${productId}/analytics`),
    staleTime: 5 * 60_000,
    enabled: authReady,
  });
}

// ── Admin Engineers List ──────────────────────────────────────
export interface AdminEngineerListItem {
  id: string;
  name: string;
  email: string;
  tier: string;
  neuronScore: number;
  status: string;
  joinedDate: string;
  flagCount: number;
  contracts: number;
}

export function useAdminEngineers(filters?: { search?: string; tier?: string; status?: string }) {
  const authReady = useProtectedQueryEnabled();
  const params = new URLSearchParams();
  if (filters?.search) params.set('search', filters.search);
  if (filters?.tier) params.set('tier', filters.tier);
  const query = params.toString();
  return useQuery<{ engineers: AdminEngineerListItem[]; total: number }>({
    queryKey: ['admin', 'engineers', filters],
    queryFn: () => apiFetch(`/api/admin/engineers${query ? `?${query}` : ''}`),
    staleTime: 60_000,
    enabled: authReady,
  });
}

// ── Admin Assessments List ────────────────────────────────────
export interface AdminAssessmentListItem {
  id: string;
  engineerName: string;
  engineerEmail: string;
  track: string;
  score: number | null;
  status: string;
  flagCount: number;
  flagTypes: string[];
  completedAt: string | null;
  duration: number;
}

export function useAdminAssessments(filter?: string) {
  const authReady = useProtectedQueryEnabled();
  return useQuery<{ assessments: AdminAssessmentListItem[]; total: number }>({
    queryKey: ['admin', 'assessments', filter],
    queryFn: () => apiFetch(`/api/admin/assessments/flagged${filter && filter !== 'all' ? `?status=${filter}` : ''}`),
    staleTime: 60_000,
    enabled: authReady,
  });
}

// ── Admin Disputes List ───────────────────────────────────────
export interface AdminDisputeListItem {
  id: string;
  contractTitle: string;
  engineerName: string;
  companyName: string;
  contractValue: number;
  daysOpen: number;
  status: string;
  reason: string;
}

export function useAdminDisputes(status?: string) {
  const authReady = useProtectedQueryEnabled();
  return useQuery<{ disputes: AdminDisputeListItem[]; total: number }>({
    queryKey: ['admin', 'disputes', status],
    queryFn: () => apiFetch(`/api/admin/disputes${status && status !== 'all' ? `?status=${status}` : ''}`),
    staleTime: 60_000,
    enabled: authReady,
  });
}

// ── Engineer Search (company browse) ──────────────────────────
export function useEngineerSearch(params: {
  query?: string;
  skills?: string[];
  minNeuronScore?: number;
  maxNeuronScore?: number;
  availabilityStatus?: string;
  minHourlyRate?: number;
  maxHourlyRate?: number;
}) {
  const authReady = useProtectedQueryEnabled();
  const q = new URLSearchParams();
  if (params.query) q.set('query', params.query);
  if (params.skills?.length) q.set('skills', params.skills.join(','));
  if (params.minNeuronScore != null) q.set('minNeuronScore', String(params.minNeuronScore));
  if (params.maxNeuronScore != null) q.set('maxNeuronScore', String(params.maxNeuronScore));
  if (params.availabilityStatus && params.availabilityStatus !== 'any') {
    q.set('availabilityStatus', params.availabilityStatus);
  }
  if (params.minHourlyRate != null) q.set('minHourlyRate', String(params.minHourlyRate));
  if (params.maxHourlyRate != null) q.set('maxHourlyRate', String(params.maxHourlyRate));
  q.set('limit', '50');

  return useQuery<unknown[]>({
    queryKey: ['search', 'engineers', params],
    queryFn: () => apiFetchList(`/api/search/engineers?${q.toString()}`),
    staleTime: 60_000,
    enabled: authReady,
  });
}

export interface SmartMatchedEngineer {
  id: string;
  fullName: string;
  headline: string | null;
  neuronScore: number;
  neuronTier: string;
  hourlyRate: number;
  availabilityStatus: string;
  skills: string[];
  matchScore: number;
  recommendationReason: string;
}

export function useSmartMatchedEngineers(problemStatement: string, limit = 5) {
  const authReady = useProtectedQueryEnabled(problemStatement.trim().length >= 20);
  return useQuery<SmartMatchedEngineer[]>({
    queryKey: ['engineers', 'smart-match', problemStatement, limit],
    queryFn: () =>
      apiFetch('/api/engineers/smart-match', {
        method: 'POST',
        body: JSON.stringify({ problemStatement, limit }),
      }),
    enabled: authReady,
    staleTime: 60_000,
  });
}

export interface HiringMatchResult {
  skillMatchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  budgetFit: 'within_range' | 'above_budget' | 'below_market';
  availabilityConfidence: 'high' | 'medium' | 'low';
  recommendationReason: string;
}

export function useHiringMatch(engineerId: string, jobRequirements: string) {
  const authReady = useProtectedQueryEnabled(
    !!engineerId && jobRequirements.trim().length >= 10,
  );
  const q = new URLSearchParams({ jobRequirements });
  return useQuery<HiringMatchResult>({
    queryKey: ['engineers', engineerId, 'hiring-match', jobRequirements],
    queryFn: () => apiFetch(`/api/engineers/${engineerId}/hiring-match?${q.toString()}`),
    enabled: authReady,
    staleTime: 60_000,
  });
}

// ── Engineer Analytics ────────────────────────────────────────
export interface EngineerAnalyticsApi {
  summary: {
    totalViews: number;
    totalProposals: number;
    totalAccepted: number;
    acceptanceRate: string;
    totalEarnings: number;
  };
  trends: {
    profileViews: { date: string; value: number }[];
    proposals: { date: string; sent: number; accepted: number }[];
    earnings: { date: string; value: number }[];
  };
  topKeywords: { keyword: string; count: number }[];
  topSkills: { name: string; views: number }[];
}

export function useEngineerAnalytics() {
  const authReady = useProtectedQueryEnabled();
  return useQuery<EngineerAnalyticsApi>({
    queryKey: QUERY_KEYS.engineerAnalytics,
    queryFn: () => apiFetch('/api/analytics/engineer/me'),
    staleTime: 5 * 60_000,
    enabled: authReady,
  });
}

// ── My Bounty Submissions ─────────────────────────────────────
export interface MyBountySubmission {
  id: string;
  taskId: string;
  taskTitle: string;
  companyName: string;
  reward: number;
  taskStatus: string;
  taskType: string;
  status: string;
  submittedAt: string;
  payoutAmount: number | null;
  score: number | null;
}

export function useMyBountySubmissions() {
  const authReady = useProtectedQueryEnabled();
  return useQuery<MyBountySubmission[]>({
    queryKey: ['tasks', 'my-submissions'],
    queryFn: () => apiFetchList('/api/tasks/my-submissions'),
    staleTime: 60_000,
    enabled: authReady,
  });
}

// ── Company Profile ───────────────────────────────────────────
export interface CompanyProfileData {
  id: string;
  companyName: string;
  description: string | null;
  website: string | null;
  location: string | null;
  industry: string | null;
  size: string | null;
  gstNumber: string | null;
  isHiring: boolean;
  hiringIntents: string[];
  aiRequirements: string[];
  trustScore: number;
  websiteVerified: boolean;
  gstVerified: boolean;
}

export function useCompanyProfile() {
  const authReady = useProtectedQueryEnabled();
  return useQuery<CompanyProfileData | null>({
    queryKey: ['company', 'profile'],
    queryFn: () => apiFetch('/api/company/profile'),
    staleTime: 5 * 60_000,
    enabled: authReady,
  });
}

export function useUpdateCompanyProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<CompanyProfileData>) =>
      apiFetch('/api/company/profile', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['company', 'profile'] });
    },
  });
}

// ── Admin Moderation Queue ────────────────────────────────────
export interface ModerationQueueProduct {
  id: string;
  name: string;
  tagline: string;
  category: string;
  status: string;
  engineerProfile: { fullName: string };
  user: { email: string };
  createdAt: string;
}

export function useAdminModerationQueue() {
  const authReady = useProtectedQueryEnabled();
  return useQuery<{ products: ModerationQueueProduct[]; total: number }>({
    queryKey: QUERY_KEYS.adminModeration,
    queryFn: () => apiFetch('/api/admin/moderation/queue'),
    staleTime: 30_000,
    enabled: authReady,
  });
}

export interface AdminDisputeDetail {
  id: string;
  productName: string;
  productId: string;
  buyerName: string;
  sellerName: string;
  amount: number;
  reason: string;
  status: string;
  createdAt: string;
  resolution: string | null;
}

export function useAdminDisputeDetail(id: string) {
  const authReady = useProtectedQueryEnabled(!!id);
  return useQuery<AdminDisputeDetail>({
    queryKey: ['admin', 'dispute', id],
    queryFn: () => apiFetch(`/api/admin/disputes/${id}`),
    enabled: authReady,
    staleTime: 60_000,
  });
}

export interface AdminCompanyDetail {
  id: string;
  companyName: string;
  email: string;
  industry: string | null;
  size: string | null;
  location: string | null;
  websiteVerified: boolean;
  gstVerified: boolean;
  trustScore: number;
  taskCount: number;
  contractCount: number;
  totalSpend: number;
}

export function useAdminCompanyDetail(id: string) {
  const authReady = useProtectedQueryEnabled(!!id);
  return useQuery<AdminCompanyDetail>({
    queryKey: ['admin', 'company', id],
    queryFn: () => apiFetch(`/api/admin/companies/${id}`),
    enabled: authReady,
    staleTime: 60_000,
  });
}

export function usePublicEngineerProfile(id: string) {
  return useQuery<Record<string, unknown>>({
    queryKey: ['engineer', 'public', id],
    queryFn: () => apiFetch(`/api/engineer/profiles/${id}`),
    enabled: !!id,
    staleTime: 5 * 60_000,
  });
}
