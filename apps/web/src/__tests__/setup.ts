import '@testing-library/jest-dom';

// Polyfill performance.now() for jsdom
if (typeof performance === 'undefined') {
  (global as any).performance = { now: () => Date.now() };
}

// Polyfill scrollIntoView — not implemented in jsdom
window.HTMLElement.prototype.scrollIntoView = jest.fn();

// ── Mock global fetch so API calls don't hang in tests ────────
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: async () => ({}),
  text: async () => '',
  status: 200,
} as any);

// ── Mock next/navigation ──────────────────────────────────────
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  redirect: jest.fn(),
}));

// ── Mock Clerk ────────────────────────────────────────────────
jest.mock('@clerk/nextjs', () => ({
  useSignUp: jest.fn(() => ({
    isLoaded: true,
    signUp: {
      create: jest.fn(),
      prepareEmailAddressVerification: jest.fn(),
      attemptEmailAddressVerification: jest.fn(),
      authenticateWithRedirect: jest.fn(),
      emailAddress: 'test@example.com',
      unsafeMetadata: { role: 'engineer' },
    },
    setActive: jest.fn(),
  })),
  useSignIn: jest.fn(() => ({
    isLoaded: true,
    signIn: { create: jest.fn(), authenticateWithRedirect: jest.fn() },
    setActive: jest.fn(),
  })),
  useUser: jest.fn(() => ({
    user: {
      firstName: 'Arjun',
      primaryEmailAddress: { emailAddress: 'arjun.sharma@example.com' },
    },
    isLoaded: true,
  })),
  auth: () => ({ userId: null }),
  ClerkProvider: ({ children }: any) => children,
  SignedIn: () => null,
  SignedOut: ({ children }: any) => children,
  UserButton: () => null,
  AuthenticateWithRedirectCallback: () => null,
}));

// ── Mock sonner ───────────────────────────────────────────────
jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn(), info: jest.fn() },
  Toaster: () => null,
}));

// ── Mock @/lib/api-hooks ──────────────────────────────────────
// All hooks return stable mock data so tests never make real API calls.
jest.mock('@/lib/api-hooks', () => ({
  usePlatformStats: () => ({ data: null, isLoading: true, error: null }),
  useFeaturedEngineers: () => ({ data: [], isLoading: false, error: null }),
  useFeaturedProducts: () => ({ data: [], isLoading: false, error: null }),
  useFeaturedBounties: () => ({ data: [], isLoading: false, error: null }),
  useEngineerDashboard: () => ({ data: null, isLoading: false, error: null }),
  useRecommendedBounties: () => ({ data: [], isLoading: false, error: null }),
  useEngineerActivity: () => ({ data: [], isLoading: false, error: null }),
  useCompanyDashboard: () => ({ data: null, isLoading: false, error: null }),
  usePendingSubmissions: () => ({ data: [], isLoading: false, error: null }),
  useAdminStats: () => ({
    data: {
      totalEngineers: 1247,
      totalCompanies: 312,
      activeContracts: 89,
      gmvToday: 427000,
      gmvThisWeek: 1850000,
      gmvThisMonth: 7200000,
      assessmentPassRate: 71.5,
      platformFeeToday: 42700,
      platformFeeThisWeek: 185000,
      platformFeeThisMonth: 720000,
      pendingDisputes: 3,
      flaggedAssessments: 7,
      moderationQueue: 12,
    },
    isLoading: false,
    error: null,
  }),
  useAdminRevenue: () => ({
    data: [
      { date: '2024-06', contracts: 320000, bounties: 85000, marketplace: 22000, total: 427000 },
      { date: '2024-07', contracts: 410000, bounties: 110000, marketplace: 31000, total: 551000 },
      { date: '2024-08', contracts: 380000, bounties: 95000, marketplace: 28000, total: 503000 },
      { date: '2024-09', contracts: 450000, bounties: 120000, marketplace: 35000, total: 605000 },
      { date: '2024-10', contracts: 520000, bounties: 140000, marketplace: 42000, total: 702000 },
      { date: '2024-11', contracts: 480000, bounties: 130000, marketplace: 38000, total: 648000 },
    ],
    isLoading: false,
    error: null,
  }),
  useAdminActivity: () => ({
    data: [
      { id: 'act-1', type: 'signup', message: 'New engineer signup: Rahul Verma', timestamp: '2 min ago' },
      { id: 'act-2', type: 'assessment_pass', message: 'Assessment passed: Priya Nair (Score: 87)', timestamp: '8 min ago' },
      { id: 'act-3', type: 'payment_processed', message: 'Payment processed: ₹45,000', timestamp: '15 min ago' },
    ],
    isLoading: false,
    error: null,
  }),
  useWallet: () => ({
    data: { balance: 245000, pendingRelease: 85000, thisMonthEarnings: 180000, currency: 'INR' },
    isLoading: false,
    isError: false,
    error: null,
  }),
  useWalletTransactions: () => ({
    data: {
      transactions: [
        { id: 'txn-1', type: 'credit', amount: 50000, description: 'Voice AI Agent - Milestone 1', createdAt: '2024-11-20T00:00:00Z', balanceBefore: 0, balanceAfter: 50000 },
        { id: 'txn-2', type: 'credit', amount: 25000, description: 'RAG System Optimization', createdAt: '2024-11-18T00:00:00Z', balanceBefore: 50000, balanceAfter: 75000 },
        { id: 'txn-3', type: 'credit', amount: 5000, description: 'LangChain Template Sale', createdAt: '2024-11-15T00:00:00Z', balanceBefore: 75000, balanceAfter: 80000 },
        { id: 'txn-4', type: 'debit', amount: 100000, description: 'Withdrawal to UPI', createdAt: '2024-11-12T00:00:00Z', balanceBefore: 80000, balanceAfter: -20000 },
        { id: 'txn-5', type: 'credit', amount: 50000, description: 'Voice AI Agent - Milestone 2', createdAt: '2024-11-10T00:00:00Z', balanceBefore: -20000, balanceAfter: 30000 },
      ],
      nextCursor: null,
    },
    isLoading: false,
    error: null,
  }),
  useEarningsChart: () => ({
    data: [
      { date: '2024-05', contracts: 120000, bounties: 45000, marketplace: 8000, total: 173000 },
      { date: '2024-06', contracts: 150000, bounties: 60000, marketplace: 12000, total: 222000 },
      { date: '2024-07', contracts: 180000, bounties: 55000, marketplace: 15000, total: 250000 },
      { date: '2024-08', contracts: 200000, bounties: 70000, marketplace: 18000, total: 288000 },
      { date: '2024-09', contracts: 175000, bounties: 65000, marketplace: 20000, total: 260000 },
      { date: '2024-10', contracts: 220000, bounties: 80000, marketplace: 25000, total: 325000 },
    ],
    isLoading: false,
    error: null,
  }),
  useWithdraw: () => ({ mutateAsync: jest.fn().mockResolvedValue({}), isPending: false }),
  useTaskSubmissions: () => ({ data: [], isLoading: false, error: null }),
  useSubmissionDetail: () => ({ data: null, isLoading: false, error: null }),
  useAdminEngineerDetail: () => ({ data: null, isLoading: false, error: null }),
  useAdminAssessmentDetail: () => ({ data: null, isLoading: false, error: null }),
  useAdminProductDetail: () => ({ data: null, isLoading: false, error: null }),
  useEngineerSettings: () => ({
    data: {
      profile: { fullName: 'Arjun Sharma', headline: '', bio: '', email: 'arjun.sharma@example.com' },
      notifications: {
        email: { newMessage: true, newBountyMatch: true, paymentReceived: true, contractUpdate: true },
        push: { newMessage: true, newBountyMatch: false, paymentReceived: true, contractUpdate: false },
      },
      privacy: { marketingEmails: false, aiRecommendations: true, publicActivityFeed: true },
    },
    isLoading: false,
    error: null,
  }),
  useActiveSessions: () => ({
    data: [
      { id: 'session-1', device: 'MacBook Pro', browser: 'Chrome 120', location: 'Bangalore, India', lastActive: '2 minutes ago', isCurrent: true },
      { id: 'session-2', device: 'iPhone 15', browser: 'Safari', location: 'Bangalore, India', lastActive: '3 hours ago', isCurrent: false },
      { id: 'session-3', device: 'Windows PC', browser: 'Edge 120', location: 'Mumbai, India', lastActive: '2 days ago', isCurrent: false },
    ],
    isLoading: false,
    error: null,
  }),
  useUpdateSettings: () => ({ mutate: jest.fn(), isPending: false }),
  useRevokeSession: () => ({ mutate: jest.fn(), isPending: false }),
  useApproveSubmission: () => ({ mutateAsync: jest.fn().mockResolvedValue({}), isPending: false }),
  useRejectSubmission: () => ({ mutateAsync: jest.fn().mockResolvedValue({}), isPending: false }),
  useEvaluateSubmission: () => ({ mutateAsync: jest.fn().mockResolvedValue({}), isPending: false }),
  useAdminScoreOverride: () => ({ mutateAsync: jest.fn().mockResolvedValue({}), isPending: false }),
  useAdminSuspendEngineer: () => ({ mutateAsync: jest.fn().mockResolvedValue({}), isPending: false }),
  useAdminAssessmentDecision: () => ({ mutateAsync: jest.fn().mockResolvedValue({}), isPending: false }),
  useAdminProductDecision: () => ({ mutateAsync: jest.fn().mockResolvedValue({}), isPending: false }),
  useNeuronScoreHistory: () => ({
    data: [{ date: '2024-11-01', score: 920, reason: 'Assessment', delta: 20 }],
    isLoading: false,
    error: null,
  }),
  // Admin list hooks
  useAdminEngineers: () => ({
    data: {
      engineers: [
        { id: 'eng-1', name: 'Arjun Sharma',  email: 'arjun.sharma@dev.in',  tier: 'elite',        neuronScore: 820, status: 'active',    joinedDate: '2026-01-15', flagCount: 0, contracts: 2 },
        { id: 'eng-2', name: 'Priya Nair',    email: 'priya.nair@dev.in',    tier: 'professional', neuronScore: 640, status: 'active',    joinedDate: '2026-01-20', flagCount: 0, contracts: 1 },
        { id: 'eng-3', name: 'Vikram Singh',  email: 'vikram.singh@dev.in',  tier: 'conditional',  neuronScore: 280, status: 'suspended', joinedDate: '2026-02-01', flagCount: 5, contracts: 0 },
      ],
      total: 3,
    },
    isLoading: false,
    error: null,
  }),
  useAdminAssessments: () => ({
    data: {
      assessments: [
        { id: 'asmt-1', engineerName: 'Arjun Sharma',  engineerEmail: 'arjun.sharma@dev.in',  track: 'LLM Engineering',  score: 88, status: 'completed', flagCount: 0, flagTypes: [], completedAt: '2026-01-15', duration: 87 },
        { id: 'asmt-2', engineerName: 'Priya Nair',    engineerEmail: 'priya.nair@dev.in',    track: 'Computer Vision',  score: 74, status: 'completed', flagCount: 0, flagTypes: [], completedAt: '2026-01-20', duration: 92 },
        { id: 'asmt-3', engineerName: 'Vikram Singh',  engineerEmail: 'vikram.singh@dev.in',  track: 'LLM Engineering',  score: 48, status: 'flagged',   flagCount: 3, flagTypes: ['tab_switch', 'copy_paste'], completedAt: '2026-02-01', duration: 45 },
      ],
      total: 3,
    },
    isLoading: false,
    error: null,
  }),
  useAdminDisputes: () => ({
    data: {
      disputes: [
        { id: 'disp-1', contractTitle: 'Voice AI Agent', engineerName: 'Arjun Sharma', companyName: 'Sarvam AI', contractValue: 150000, daysOpen: 5, status: 'open', reason: 'Deliverable does not match agreed scope' },
        { id: 'disp-2', contractTitle: 'MLOps Pipeline', engineerName: 'Priya Nair', companyName: 'Razorpay', contractValue: 80000, daysOpen: 2, status: 'under_review', reason: 'Quality below agreed standard' },
      ],
      total: 2,
    },
    isLoading: false,
    error: null,
  }),
  // Additional hooks
  useMyEngineerProfile: () => ({
    data: { id: 'p1', fullName: 'Arjun Sharma', headline: 'LLM Engineer · RAG Systems · Agentic AI', bio: 'Specialized in building production-grade LLM applications...', location: 'Bengaluru, India', hourlyRate: 4500, availabilityStatus: 'available_now', neuronScore: 920, neuronTier: 'Elite', completenessScore: 92, githubUrl: '', linkedinUrl: '', portfolioUrl: '', upiId: 'arjun@paytm' },
    isLoading: false, error: null,
  }),
  useMyContracts: () => ({ data: [], isLoading: false, error: null }),
  useSubmitContractMilestone: () => ({
    mutateAsync: jest.fn().mockResolvedValue({}),
    isPending: false,
  }),
  useApproveContractMilestone: () => ({
    mutateAsync: jest.fn().mockResolvedValue({}),
    isPending: false,
  }),
  useRaiseContractDispute: () => ({
    mutateAsync: jest.fn().mockResolvedValue({}),
    isPending: false,
  }),
  useContractDetail: (id: string) => ({
    data: {
      id: id || 'contract-1',
      title: 'Build Multilingual Voice AI Agent',
      scope: 'Build a multilingual voice AI agent',
      status: 'active',
      hiringMode: 'project',
      companyName: 'Sarvam AI',
      companyLogoUrl: null,
      engineerName: 'Arjun Sharma',
      totalAmount: 150000,
      hourlyRate: null,
      startDate: new Date(Date.now() - 10 * 86400000).toISOString(),
      endDate: null,
      finalContractUrl: '/contract.pdf',
      milestones: [
        { id: 'm1', milestoneNumber: 1, title: 'STT + LLM Pipeline', description: 'Build speech-to-text pipeline', amount: 50000, status: 'paid', dueDate: new Date(Date.now() - 5 * 86400000).toISOString(), submittedAt: new Date(Date.now() - 7 * 86400000).toISOString(), approvedAt: new Date(Date.now() - 5 * 86400000).toISOString(), paidAt: new Date(Date.now() - 5 * 86400000).toISOString() },
        { id: 'm2', milestoneNumber: 2, title: 'TTS + Twilio Integration', description: 'Integrate LLM for NLU', amount: 60000, status: 'submitted', dueDate: new Date(Date.now() + 3 * 86400000).toISOString(), submittedAt: new Date(Date.now() - 1 * 3600000).toISOString(), approvedAt: null, paidAt: null },
        { id: 'm3', milestoneNumber: 3, title: 'Load Testing & Deployment', description: 'Text-to-speech and deploy', amount: 40000, status: 'pending', dueDate: new Date(Date.now() + 14 * 86400000).toISOString(), submittedAt: null, approvedAt: null, paidAt: null },
      ],
    },
    isLoading: false,
    error: null,
  }),
  useEngineerSearch: () => ({
    data: [
      {
        id: 'eng-1',
        fullName: 'Arjun Sharma',
        headline: 'LLM Engineer · RAG Systems',
        neuronScore: 920,
        neuronTier: 'elite',
        hourlyRate: 4500,
        skills: ['LangChain', 'PyTorch'],
        availabilityStatus: 'available_now',
        rating: 4.97,
        projectCount: 28,
        reviewCount: 43,
        matchScore: 94,
      },
    ],
    isLoading: false,
    error: null,
  }),
  useUpdateEngineerProfile: () => ({
    mutateAsync: jest.fn().mockResolvedValue({
      fullName: 'Arjun Sharma',
      headline: 'LLM Engineer · RAG Systems · Agentic AI',
      bio: 'Specialized in building production-grade LLM applications...',
    }),
    isPending: false,
  }),
  useEngineerAnalytics: () => ({
    data: {
      summary: {
        totalViews: 1247,
        totalProposals: 50,
        totalAccepted: 34,
        acceptanceRate: '68',
        totalEarnings: 180000,
      },
      trends: {
        profileViews: [{ date: '2024-11-01', value: 100 }],
        proposals: [],
        earnings: [],
      },
      topKeywords: [
        { keyword: 'LangChain', count: 342 },
        { keyword: 'RAG Systems', count: 287 },
      ],
      topSkills: [{ name: 'LangChain', views: 45 }],
    },
    isLoading: false,
    error: null,
  }),
  useMyBountySubmissions: () => ({ data: [], isLoading: false, error: null }),
  useCompanyProfile: () => ({
    data: {
      companyName: 'Sarvam AI',
      description: 'Building India\'s AI stack',
      website: 'https://sarvam.ai',
      location: 'Bangalore',
      industry: 'AI/ML',
      size: '51-200',
      gstNumber: '',
      isHiring: true,
      hiringIntents: ['full_time'],
      aiRequirements: ['nlp'],
    },
    isLoading: false,
    isError: false,
    error: null,
  }),
  useUpdateCompanyProfile: () => ({ mutateAsync: jest.fn().mockResolvedValue({}), isPending: false }),
  useAdminModerationQueue: () => ({
    data: {
      products: [
        {
          id: 'mod-1',
          name: 'RAG Pipeline Toolkit',
          tagline: 'Production RAG templates',
          engineerProfile: { fullName: 'Vikram Singh' },
          user: { email: 'vikram@dev.in' },
          createdAt: '2026-01-15T00:00:00Z',
        },
        {
          id: 'mod-2',
          name: 'Agent Orchestrator',
          tagline: 'Multi-agent workflows',
          engineerProfile: { fullName: 'Priya Nair' },
          user: { email: 'priya@dev.in' },
          createdAt: '2026-01-18T00:00:00Z',
        },
        {
          id: 'mod-3',
          name: 'CV Model Pack',
          tagline: 'Vision model utilities',
          engineerProfile: { fullName: 'Arjun Sharma' },
          user: { email: 'arjun@dev.in' },
          createdAt: '2026-01-20T00:00:00Z',
        },
      ],
      total: 3,
    },
    isLoading: false,
    error: null,
  }),
  useAdminDisputeDetail: () => ({ data: null, isLoading: false, error: null }),
  useAdminCompanyDetail: () => ({ data: null, isLoading: false, error: null }),
  usePublicEngineerProfile: () => ({
    data: {
      id: 'eng-1',
      fullName: 'Arjun Sharma',
      headline: 'LLM Engineer · RAG Systems · Agentic AI',
      bio: 'Specialized in building production-grade LLM applications.',
      location: 'Bengaluru, India',
      hourlyRate: 5000,
      neuronScore: 920,
      neuronTier: 'elite',
      availabilityStatus: 'available_now',
      skills: [{ skillName: 'LangChain' }, { skillName: 'PyTorch' }],
      kycVerified: true,
    },
    isLoading: false,
    error: null,
  }),
  useCompanyTasks: () => ({ data: [], isLoading: false, error: null }),
  useTaskDetail: () => ({
    data: {
      id: 'task-1',
      title: 'Build RAG Pipeline for Legal Docs',
      type: 'bounty',
      status: 'open',
      rewardAmount: 75000,
      currency: 'INR',
      difficulty: 'intermediate',
      problemStatement: 'Build a production RAG system for legal document search.',
      techRequirements: ['LangChain', 'Pinecone'],
      minNeuronScore: 600,
    },
    isLoading: false,
    error: null,
  }),
  useSubmitTask: () => ({
    mutateAsync: jest.fn().mockResolvedValue({}),
    isPending: false,
  }),
  useCompanyAnalytics: () => ({ data: null, isLoading: false, error: null }),
  useMarketRates: () => ({
    data: {
      bySkill: [
        {
          skill: 'LangChain',
          sampleSize: 128,
          p10: 2500,
          p25: 3200,
          median: 4500,
          p75: 6200,
          p90: 8500,
          tierBreakdown: [
            { tier: 'Elite', avgRate: 8500 },
            { tier: 'Professional', avgRate: 5500 },
            { tier: 'Verified', avgRate: 4200 },
            { tier: 'Conditional', avgRate: 2800 },
          ],
          relatedSkills: ['LlamaIndex', 'RAG', 'OpenAI'],
        },
      ],
    },
    isLoading: false,
    error: null,
  }),
  useConversations: () => ({
    data: [
      { id: 'conv-1', otherUserId: 'company-1', otherUserName: 'Sarvam AI', otherUserRole: 'company', lastMessage: 'The STT pipeline is ready for review', lastMessageAt: new Date(Date.now() - 2 * 3600000).toISOString(), unreadCount: 3 },
      { id: 'conv-2', otherUserId: 'company-2', otherUserName: 'Razorpay', otherUserRole: 'company', lastMessage: 'Can you share the benchmark results?', lastMessageAt: new Date(Date.now() - 5 * 3600000).toISOString(), unreadCount: 0 },
      { id: 'conv-3', otherUserId: 'company-3', otherUserName: 'Zepto', otherUserRole: 'company', lastMessage: 'Hi, we are interested in your profile', lastMessageAt: new Date(Date.now() - 24 * 3600000).toISOString(), unreadCount: 1, requestStatus: 'pending', type: 'request' },
    ],
    isLoading: false,
    error: null,
  }),
  useMessages: () => ({ data: [], isLoading: false, error: null }),
  useNotifications: () => ({ data: [], isLoading: false, error: null }),
  useNeuronScore: () => ({
    data: { score: 920, tier: 'Elite', breakdown: { assessment: 88, clientRatings: 95, portfolioDepth: 85, workDelivery: 92, marketplace: 78, community: 70 }, history: [] },
    isLoading: false, error: null,
  }),
  useMyProducts: () => ({ data: [], isLoading: false, error: null }),
  useMyPurchases: () => ({ data: [], isLoading: false, error: null }),
  useProductAnalytics: () => ({
    data: {
      productId: 'prod-1',
      productName: 'RAG Pipeline Toolkit',
      revenue: [
        { date: '2024-11-01', revenue: 12000, sales: 3 },
        { date: '2024-11-02', revenue: 8000, sales: 2 },
        { date: '2024-11-03', revenue: 15000, sales: 4 },
      ],
      funnel: { views: 1200, demoClicks: 340, purchases: 89 },
      ratingTrend: [{ date: '2024-11-01', rating: 4.8 }],
      topIndustries: [{ industry: 'FinTech', count: 12 }],
    },
    isLoading: false,
    error: null,
  }),
}));
