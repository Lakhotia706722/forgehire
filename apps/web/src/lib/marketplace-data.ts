/**
 * Mock data for the AI Marketplace (Module 5).
 * In production, replace with API calls.
 */

export type ProductCategory =
  | 'AI Agents'
  | 'Fine-Tuned Models'
  | 'SaaS Tools'
  | 'Automation'
  | 'Datasets & Prompts'
  | 'APIs';

export type PricingModel = 'one_time' | 'subscription' | 'freemium' | 'per_call';

export type AIModel = 'GPT-4' | 'Claude' | 'Llama' | 'Open-source' | 'Custom';

export interface ProductListing {
  id: string;
  name: string;
  tagline: string;
  category: ProductCategory;
  tags: string[];
  thumbnailGradient: string;
  thumbnailUrl?: string;
  screenshots: string[];
  videoUrl?: string;
  demoUrl?: string;
  hasTryBeforeBuy: boolean;

  // Engineer
  engineerId: string;
  engineerName: string;
  engineerInitials: string;
  engineerColor: string;
  engineerScore: number;

  // Pricing
  pricingModel: PricingModel;
  priceINR: number;
  priceUSD: number;
  pricingTiers?: PricingTier[];

  // Ratings
  rating: number;
  reviewCount: number;

  // Tech
  techStack: string[];
  aiModel: AIModel;
  architectureType: string;
  hostingRequirements: string[];
  apiDependencies: string[];

  // Features
  features: { icon: string; text: string }[];
  useCases: string[];
  whoItsFor: string;
  deliverables: string[];
  supportType: string;
  supportDuration: string;
  responseTimeSLA: string;
  customizationAvailable: boolean;
  customizationPrice?: number;

  // Performance
  accuracy?: number;
  avgResponseMs?: number;
  uptime?: number;

  // Stats
  purchaseCount: number;
  viewCount: number;
  demoClickCount: number;

  // Description
  description: string;
  problemSolved: string;

  // Bundle
  bundleIds?: string[];
  bundleDiscount?: number;
}

export interface PricingTier {
  id: string;
  name: string;
  priceINR: number;
  priceUSD: number;
  billingCycle?: 'monthly' | 'annual';
  features: string[];
  highlighted?: boolean;
}

export interface ProductReview {
  id: string;
  productId: string;
  reviewerName: string;
  reviewerInitials: string;
  reviewerCompany: string;
  rating: number;
  text: string;
  date: string;
  verified: boolean;
  plan?: string;
}

export interface AnalyticsData {
  productId: string;
  revenue: DailyRevenue[];
  funnel: { views: number; demoClicks: number; purchases: number };
  industryBreakdown: { industry: string; count: number; pct: number }[];
  ratingTrend: { month: string; rating: number }[];
  recentPurchases: RecentPurchase[];
  activeSubscribers?: number;
  churnRate?: number;
}

export interface DailyRevenue {
  date: string;
  revenue: number;
  sales: number;
}

export interface RecentPurchase {
  id: string;
  buyerAnon: string;
  date: string;
  plan: string;
  amount: number;
}

// ─── Category metadata ────────────────────────────────────────
export const CATEGORIES: { id: ProductCategory; icon: string; count: number }[] = [
  { id: 'AI Agents',          icon: '🤖', count: 142 },
  { id: 'Fine-Tuned Models',  icon: '🧠', count: 89  },
  { id: 'SaaS Tools',         icon: '⚡', count: 203 },
  { id: 'Automation',         icon: '🔄', count: 167 },
  { id: 'Datasets & Prompts', icon: '📊', count: 94  },
  { id: 'APIs',               icon: '🔌', count: 118 },
];

// ─── Mock products ────────────────────────────────────────────
export const MOCK_PRODUCTS: ProductListing[] = [
  {
    id: 'prod-1',
    name: 'RAG Pipeline Starter Kit',
    tagline: 'Production-ready RAG with LangChain + Pinecone in 10 minutes',
    category: 'APIs',
    tags: ['RAG', 'LangChain', 'Pinecone', 'FastAPI'],
    thumbnailGradient: 'from-[rgba(0,212,255,0.2)] to-[rgba(123,94,167,0.15)]',
    screenshots: [],
    hasTryBeforeBuy: true,
    engineerId: 'eng-1',
    engineerName: 'Arjun Sharma',
    engineerInitials: 'AS',
    engineerColor: '#F59E0B',
    engineerScore: 920,
    pricingModel: 'one_time',
    priceINR: 4999,
    priceUSD: 60,
    rating: 4.9,
    reviewCount: 128,
    techStack: ['Python', 'LangChain', 'Pinecone', 'FastAPI', 'Docker'],
    aiModel: 'GPT-4',
    architectureType: 'Microservice',
    hostingRequirements: ['Docker', 'AWS/GCP/Azure'],
    apiDependencies: ['OpenAI API', 'Pinecone API'],
    features: [
      { icon: '⚡', text: 'Sub-200ms retrieval on 1M+ documents' },
      { icon: '🔄', text: 'Hybrid BM25 + dense search' },
      { icon: '📦', text: 'Docker-ready deployment' },
      { icon: '🔌', text: 'REST API with OpenAPI docs' },
      { icon: '🛡️', text: 'Rate limiting + auth built-in' },
    ],
    useCases: ['Customer support chatbots', 'Document Q&A systems', 'Knowledge base search'],
    whoItsFor: 'AI engineers building production RAG systems who need a battle-tested foundation.',
    deliverables: ['Source code (Python)', 'Docker Compose setup', 'API documentation', '30-min onboarding call'],
    supportType: 'Email + GitHub Issues',
    supportDuration: '6 months',
    responseTimeSLA: '< 24 hours',
    customizationAvailable: true,
    customizationPrice: 15000,
    accuracy: 94.2,
    avgResponseMs: 180,
    uptime: 99.9,
    purchaseCount: 312,
    viewCount: 4820,
    demoClickCount: 891,
    description: 'A production-grade RAG pipeline built on LangChain and Pinecone. Handles chunking, embedding, retrieval, and generation with a clean FastAPI interface.',
    problemSolved: 'Building RAG from scratch takes weeks. This kit gives you a production-ready foundation in hours.',
    bundleIds: ['prod-2'],
    bundleDiscount: 20,
  },
  {
    id: 'prod-2',
    name: 'Multi-Agent Customer Support System',
    tagline: 'Orchestrate 5 specialised AI agents to handle support at scale',
    category: 'AI Agents',
    tags: ['AutoGen', 'GPT-4', 'Multi-agent', 'Support'],
    thumbnailGradient: 'from-[rgba(123,94,167,0.2)] to-[rgba(245,158,11,0.1)]',
    screenshots: [],
    hasTryBeforeBuy: true,
    engineerId: 'eng-1',
    engineerName: 'Arjun Sharma',
    engineerInitials: 'AS',
    engineerColor: '#F59E0B',
    engineerScore: 920,
    pricingModel: 'subscription',
    priceINR: 2999,
    priceUSD: 36,
    pricingTiers: [
      { id: 't1', name: 'Starter', priceINR: 999, priceUSD: 12, billingCycle: 'monthly', features: ['Up to 1,000 tickets/mo', '3 agents', 'Email support'] },
      { id: 't2', name: 'Growth', priceINR: 2999, priceUSD: 36, billingCycle: 'monthly', features: ['Up to 10,000 tickets/mo', '5 agents', 'Priority support', 'Analytics'], highlighted: true },
      { id: 't3', name: 'Enterprise', priceINR: 9999, priceUSD: 120, billingCycle: 'monthly', features: ['Unlimited tickets', 'Custom agents', 'SLA guarantee', 'Dedicated support'] },
    ],
    rating: 4.8,
    reviewCount: 64,
    techStack: ['Python', 'AutoGen', 'GPT-4', 'PostgreSQL', 'Celery', 'Redis'],
    aiModel: 'GPT-4',
    architectureType: 'Multi-agent orchestration',
    hostingRequirements: ['Docker', 'PostgreSQL', 'Redis'],
    apiDependencies: ['OpenAI API'],
    features: [
      { icon: '🤖', text: '5 specialised agents (triage, knowledge, escalation, billing, feedback)' },
      { icon: '📉', text: '67% reduction in human escalations' },
      { icon: '🔗', text: 'CRM integrations (Zendesk, Freshdesk, HubSpot)' },
      { icon: '📊', text: 'Real-time analytics dashboard' },
    ],
    useCases: ['E-commerce support', 'SaaS customer success', 'Fintech query resolution'],
    whoItsFor: 'Companies handling 1,000+ support tickets per month who want to automate resolution.',
    deliverables: ['Full source code', 'Docker setup', 'CRM integration guides', 'Agent customisation docs'],
    supportType: 'Dedicated Slack channel',
    supportDuration: '12 months',
    responseTimeSLA: '< 4 hours',
    customizationAvailable: true,
    customizationPrice: 25000,
    accuracy: 89,
    avgResponseMs: 1200,
    uptime: 99.7,
    purchaseCount: 89,
    viewCount: 2340,
    demoClickCount: 445,
    description: 'An orchestrated multi-agent system that routes, resolves, and escalates customer support tickets automatically using specialised AI agents.',
    problemSolved: 'Support teams are overwhelmed. This system handles 67% of tickets without human intervention.',
  },
  {
    id: 'prod-3',
    name: 'Fine-tuned LLaMA 3 for Code Review',
    tagline: 'GPT-4 level code review at 1/10th the cost',
    category: 'Fine-Tuned Models',
    tags: ['LLaMA 3', 'LoRA', 'Code Review', 'vLLM'],
    thumbnailGradient: 'from-[rgba(16,185,129,0.15)] to-[rgba(0,212,255,0.1)]',
    screenshots: [],
    hasTryBeforeBuy: true,
    engineerId: 'eng-2',
    engineerName: 'Priya Nair',
    engineerInitials: 'PN',
    engineerColor: '#00D4FF',
    engineerScore: 845,
    pricingModel: 'per_call',
    priceINR: 0.5,
    priceUSD: 0.006,
    rating: 4.7,
    reviewCount: 43,
    techStack: ['Python', 'LLaMA 3', 'LoRA', 'vLLM', 'HuggingFace'],
    aiModel: 'Llama',
    architectureType: 'Fine-tuned transformer',
    hostingRequirements: ['GPU (A100 or H100)', 'CUDA 12+'],
    apiDependencies: [],
    features: [
      { icon: '🎯', text: '97% parity with GPT-4 on code review benchmarks' },
      { icon: '💰', text: '10x cheaper than GPT-4 API' },
      { icon: '🔒', text: 'Self-hosted — your code never leaves your infra' },
      { icon: '⚡', text: '120ms average response time' },
    ],
    useCases: ['Automated PR reviews', 'Security vulnerability detection', 'Code quality scoring'],
    whoItsFor: 'Engineering teams doing 100+ PRs/week who want automated, high-quality code review.',
    deliverables: ['Model weights (LoRA adapters)', 'vLLM serving config', 'GitHub Actions integration', 'Evaluation scripts'],
    supportType: 'Email',
    supportDuration: '3 months',
    responseTimeSLA: '< 48 hours',
    customizationAvailable: false,
    accuracy: 97,
    avgResponseMs: 120,
    uptime: 99.5,
    purchaseCount: 156,
    viewCount: 3100,
    demoClickCount: 620,
    description: 'LLaMA 3 8B fine-tuned on 500K code review pairs across Python, TypeScript, Go, and Rust. Achieves GPT-4 level performance at a fraction of the cost.',
    problemSolved: 'GPT-4 code review is expensive at scale. This model gives you the same quality for 10x less.',
  },
  {
    id: 'prod-4',
    name: 'AI Invoice Processing Agent',
    tagline: 'Extract, validate, and route invoices automatically',
    category: 'Automation',
    tags: ['Invoice', 'OCR', 'Automation', 'Finance'],
    thumbnailGradient: 'from-[rgba(245,158,11,0.15)] to-[rgba(239,68,68,0.08)]',
    screenshots: [],
    hasTryBeforeBuy: false,
    engineerId: 'eng-3',
    engineerName: 'Rahul Verma',
    engineerInitials: 'RV',
    engineerColor: '#7B5EA7',
    engineerScore: 780,
    pricingModel: 'subscription',
    priceINR: 2499,
    priceUSD: 30,
    rating: 4.6,
    reviewCount: 31,
    techStack: ['Python', 'Claude', 'Tesseract', 'FastAPI', 'PostgreSQL'],
    aiModel: 'Claude',
    architectureType: 'Document processing pipeline',
    hostingRequirements: ['Docker', 'PostgreSQL'],
    apiDependencies: ['Anthropic API'],
    features: [
      { icon: '📄', text: 'Supports PDF, PNG, JPG invoice formats' },
      { icon: '✅', text: '98.5% extraction accuracy' },
      { icon: '🔄', text: 'Auto-routes to ERP/accounting systems' },
      { icon: '🚨', text: 'Duplicate detection and fraud flagging' },
    ],
    useCases: ['Accounts payable automation', 'Expense management', 'Vendor payment processing'],
    whoItsFor: 'Finance teams processing 500+ invoices per month who want to eliminate manual data entry.',
    deliverables: ['Source code', 'Docker setup', 'ERP integration guides', 'Training data (1000 samples)'],
    supportType: 'Email + Video calls',
    supportDuration: '6 months',
    responseTimeSLA: '< 12 hours',
    customizationAvailable: true,
    customizationPrice: 20000,
    accuracy: 98.5,
    avgResponseMs: 2400,
    uptime: 99.8,
    purchaseCount: 67,
    viewCount: 1890,
    demoClickCount: 312,
    description: 'An AI agent that automatically extracts data from invoices, validates against PO records, and routes to your accounting system.',
    problemSolved: 'Manual invoice processing costs ₹150/invoice in labour. This agent does it for ₹2.',
  },
  {
    id: 'prod-5',
    name: 'Indic Language Prompt Library',
    tagline: '500+ battle-tested prompts for Hindi, Tamil, Bengali, and Telugu',
    category: 'Datasets & Prompts',
    tags: ['Prompts', 'Hindi', 'Tamil', 'Indic', 'NLP'],
    thumbnailGradient: 'from-[rgba(0,212,255,0.1)] to-[rgba(16,185,129,0.1)]',
    screenshots: [],
    hasTryBeforeBuy: true,
    engineerId: 'eng-4',
    engineerName: 'Sneha Patel',
    engineerInitials: 'SP',
    engineerColor: '#10B981',
    engineerScore: 810,
    pricingModel: 'one_time',
    priceINR: 1999,
    priceUSD: 24,
    rating: 4.5,
    reviewCount: 22,
    techStack: ['Python', 'JSON', 'Markdown'],
    aiModel: 'Open-source',
    architectureType: 'Prompt library',
    hostingRequirements: [],
    apiDependencies: [],
    features: [
      { icon: '🌐', text: '500+ prompts across 4 Indic languages' },
      { icon: '📋', text: 'Categorised by use case (customer support, content, coding)' },
      { icon: '🔄', text: 'Regular updates with new prompts' },
      { icon: '📊', text: 'Benchmark scores for each prompt' },
    ],
    useCases: ['Multilingual chatbots', 'Content generation', 'Customer support in regional languages'],
    whoItsFor: 'AI teams building products for Indian users who need reliable multilingual prompts.',
    deliverables: ['500+ prompts (JSON + Markdown)', 'Benchmark results', 'Usage examples', 'Prompt engineering guide'],
    supportType: 'Community Discord',
    supportDuration: 'Lifetime updates',
    responseTimeSLA: '< 72 hours',
    customizationAvailable: false,
    purchaseCount: 234,
    viewCount: 5600,
    demoClickCount: 1200,
    description: 'A curated library of 500+ prompts optimised for Hindi, Tamil, Bengali, and Telugu. Each prompt is benchmarked across GPT-4, Claude, and Llama.',
    problemSolved: 'Prompts written for English perform poorly in Indic languages. This library solves that.',
  },
  {
    id: 'prod-6',
    name: 'Fraud Detection API',
    tagline: 'Real-time fraud scoring at 50K transactions/sec',
    category: 'APIs',
    tags: ['Fraud', 'GNN', 'Real-time', 'Fintech'],
    thumbnailGradient: 'from-[rgba(239,68,68,0.12)] to-[rgba(245,158,11,0.1)]',
    screenshots: [],
    hasTryBeforeBuy: true,
    engineerId: 'eng-1',
    engineerName: 'Arjun Sharma',
    engineerInitials: 'AS',
    engineerColor: '#F59E0B',
    engineerScore: 920,
    pricingModel: 'per_call',
    priceINR: 0.1,
    priceUSD: 0.0012,
    rating: 4.9,
    reviewCount: 18,
    techStack: ['Python', 'PyG', 'FastAPI', 'Kafka', 'Redis'],
    aiModel: 'Custom',
    architectureType: 'Graph Neural Network',
    hostingRequirements: ['GPU recommended', 'Kafka', 'Redis'],
    apiDependencies: [],
    features: [
      { icon: '⚡', text: '8ms p99 latency' },
      { icon: '🎯', text: '99.1% precision' },
      { icon: '📈', text: 'Handles 50K TPS' },
      { icon: '🔍', text: 'Explainable fraud scores' },
    ],
    useCases: ['Payment fraud detection', 'Account takeover prevention', 'Transaction monitoring'],
    whoItsFor: 'Fintech companies processing high-volume transactions who need real-time fraud detection.',
    deliverables: ['REST API access', 'SDK (Python, Node.js)', 'Integration guide', 'Webhook support'],
    supportType: 'Dedicated Slack',
    supportDuration: '12 months',
    responseTimeSLA: '< 2 hours',
    customizationAvailable: true,
    customizationPrice: 50000,
    accuracy: 99.1,
    avgResponseMs: 8,
    uptime: 99.99,
    purchaseCount: 28,
    viewCount: 1200,
    demoClickCount: 340,
    description: 'A Graph Neural Network-based fraud detection API that analyses transaction patterns in real-time to score fraud risk.',
    problemSolved: 'Rule-based fraud detection misses 30% of fraud. This GNN catches patterns rules can\'t.',
  },
];

// ─── Mock reviews ─────────────────────────────────────────────
export const MOCK_REVIEWS: ProductReview[] = [
  {
    id: 'rev-1',
    productId: 'prod-1',
    reviewerName: 'Vikram N.',
    reviewerInitials: 'VN',
    reviewerCompany: 'Zepto',
    rating: 5,
    text: 'Saved us 3 weeks of development. The hybrid search implementation is particularly impressive — latency dropped 40% compared to our previous setup.',
    date: 'Nov 2024',
    verified: true,
    plan: 'One-time',
  },
  {
    id: 'rev-2',
    productId: 'prod-1',
    reviewerName: 'Priya M.',
    reviewerInitials: 'PM',
    reviewerCompany: 'Razorpay',
    rating: 5,
    text: 'Excellent documentation and the onboarding call was super helpful. Running in production with 2M+ documents.',
    date: 'Oct 2024',
    verified: true,
    plan: 'One-time',
  },
  {
    id: 'rev-3',
    productId: 'prod-1',
    reviewerName: 'Rohit G.',
    reviewerInitials: 'RG',
    reviewerCompany: 'Meesho',
    rating: 4,
    text: 'Great product. Minor issue with the Docker setup on M1 Macs but was resolved quickly.',
    date: 'Sep 2024',
    verified: true,
    plan: 'One-time',
  },
];

// ─── Mock analytics ───────────────────────────────────────────
export const MOCK_ANALYTICS: AnalyticsData = {
  productId: 'prod-1',
  revenue: Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 86400000).toISOString().split('T')[0],
    revenue: Math.round(4999 * (2 + Math.random() * 4)),
    sales: Math.round(2 + Math.random() * 4),
  })),
  funnel: { views: 4820, demoClicks: 891, purchases: 312 },
  industryBreakdown: [
    { industry: 'Fintech',    count: 89,  pct: 28 },
    { industry: 'E-commerce', count: 72,  pct: 23 },
    { industry: 'SaaS',       count: 65,  pct: 21 },
    { industry: 'Healthcare', count: 48,  pct: 15 },
    { industry: 'Other',      count: 38,  pct: 13 },
  ],
  ratingTrend: [
    { month: 'Jul', rating: 4.6 },
    { month: 'Aug', rating: 4.7 },
    { month: 'Sep', rating: 4.8 },
    { month: 'Oct', rating: 4.9 },
    { month: 'Nov', rating: 4.9 },
  ],
  recentPurchases: [
    { id: 'p1', buyerAnon: 'Buyer #3421', date: '2 hours ago',  plan: 'One-time', amount: 4999 },
    { id: 'p2', buyerAnon: 'Buyer #3420', date: '5 hours ago',  plan: 'One-time', amount: 4999 },
    { id: 'p3', buyerAnon: 'Buyer #3419', date: '1 day ago',    plan: 'One-time', amount: 4999 },
    { id: 'p4', buyerAnon: 'Buyer #3418', date: '1 day ago',    plan: 'One-time', amount: 4999 },
    { id: 'p5', buyerAnon: 'Buyer #3417', date: '2 days ago',   plan: 'One-time', amount: 4999 },
  ],
};

// ─── Helpers ──────────────────────────────────────────────────
export function formatPrice(priceINR: number, model: PricingModel): string {
  if (model === 'freemium') return 'Free';
  if (model === 'per_call') return `₹${priceINR}/call`;
  if (model === 'subscription') return `₹${priceINR.toLocaleString('en-IN')}/mo`;
  return `₹${priceINR.toLocaleString('en-IN')}`;
}

export function getPricingLabel(model: PricingModel): string {
  const labels: Record<PricingModel, string> = {
    one_time:     'one-time',
    subscription: '/ month',
    freemium:     'free',
    per_call:     '/ call',
  };
  return labels[model];
}

export const LISTING_CATEGORIES: { id: ProductCategory; icon: string; description: string }[] = [
  { id: 'AI Agents',          icon: '🤖', description: 'Autonomous agents that complete tasks' },
  { id: 'Fine-Tuned Models',  icon: '🧠', description: 'Domain-specific trained models' },
  { id: 'SaaS Tools',         icon: '⚡', description: 'Ready-to-use AI-powered tools' },
  { id: 'Automation',         icon: '🔄', description: 'Workflow and process automation' },
  { id: 'Datasets & Prompts', icon: '📊', description: 'Training data and prompt libraries' },
  { id: 'APIs',               icon: '🔌', description: 'AI capabilities via REST API' },
];
