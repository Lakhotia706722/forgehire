/**
 * Mock data for the Bounty & Task System (Module 4).
 * In production, replace with API calls.
 */

export type TaskType = 'Bounty' | 'Direct' | 'Contest';
export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced' | 'Hard' | 'Expert';
export type PaymentType = 'fixed' | 'milestone' | 'hourly';

export interface BountyCard {
  id: string;
  type: TaskType;
  title: string;
  description: string;
  company: string;
  companyInitials: string;
  companyColor: string;
  companyVerified: boolean;
  skills: string[];
  reward: number;
  currency: string;
  difficulty: Difficulty;
  deadline: Date;
  minNeuronScore: number;
  participantCount: number;
  ndaRequired: boolean;
  status: 'open' | 'in_progress' | 'closed';
}

export interface BountyDetail extends BountyCard {
  problemStatement: string;
  currentState: string;
  expectedOutcome: string;
  successCriteria: string[];
  deliverables: { title: string; description: string }[];
  techRequirements: string[];
  accessProvided: string[];
  aiEstimatedDays: [number, number];
  aiSuggestedReward: [number, number];
  aiRecommendedType: TaskType;
  aiPostingQuality: number;
  questions: QAItem[];
}

export interface QAItem {
  id: string;
  question: string;
  askedBy: string;
  askedAt: string;
  answer?: string;
  answeredAt?: string;
  isPublic: boolean;
}

export interface ContestPrizeTier {
  id: string;
  rank: number;
  label: string;
  amount: number;
  percentage: number;
}

export interface PostTaskState {
  type: TaskType | null;
  title: string;
  categories: string[];
  problemStatement: string;
  currentState: string;
  expectedOutcome: string;
  deliverables: { id: string; title: string; description: string; required: boolean }[];
  techRequirements: string[];
  startDate: string;
  deadline: string;
  rewardAmount: string;
  paymentType: PaymentType;
  contestPrizes: ContestPrizeTier[];
  ndaRequired: boolean;
  minNeuronScore: number;
  difficulty: Difficulty | '';
  accessTypes: string[];
  aiResult: AIEnrichmentResult | null;
}

export interface AIEnrichmentResult {
  estimatedDays: [number, number];
  suggestedReward: [number, number];
  postingQuality: number;
  deliverableGaps: string[];
  recommendedType: TaskType;
  suggestions: string[];
}

// ─── Mock bounties ────────────────────────────────────────────
export const MOCK_BOUNTIES: BountyCard[] = [
  {
    id: 'b1',
    type: 'Bounty',
    title: 'Build a Multilingual Voice AI Agent for Customer Support',
    description: 'We need a production-ready voice AI agent that handles customer queries in Hindi, Tamil, and English with 90%+ accuracy and sub-1s response time.',
    company: 'Sarvam AI',
    companyInitials: 'SA',
    companyColor: '#00D4FF',
    companyVerified: true,
    skills: ['LLM', 'Speech-to-Text', 'FastAPI', 'WebSockets', 'Hindi NLP'],
    reward: 150000,
    currency: 'INR',
    difficulty: 'Expert',
    deadline: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
    minNeuronScore: 700,
    participantCount: 14,
    ndaRequired: true,
    status: 'open',
  },
  {
    id: 'b2',
    type: 'Contest',
    title: 'Fraud Detection System Using Graph Neural Networks',
    description: 'Build a GNN-based fraud detection system processing 50K transactions/sec with 99%+ precision. Top 3 solutions win prizes.',
    company: 'Razorpay',
    companyInitials: 'RP',
    companyColor: '#F59E0B',
    companyVerified: true,
    skills: ['PyG', 'Neo4j', 'Python', 'Kafka', 'Redis'],
    reward: 200000,
    currency: 'INR',
    difficulty: 'Expert',
    deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
    minNeuronScore: 650,
    participantCount: 31,
    ndaRequired: false,
    status: 'open',
  },
  {
    id: 'b3',
    type: 'Direct',
    title: 'Demand Forecasting Model with Real-time Inventory Signals',
    description: 'Implement a time-series forecasting model that ingests real-time inventory signals from Kafka and predicts demand 7 days ahead.',
    company: 'Zepto',
    companyInitials: 'ZP',
    companyColor: '#7B5EA7',
    companyVerified: true,
    skills: ['Time Series', 'PyTorch', 'Kafka', 'dbt', 'Airflow'],
    reward: 80000,
    currency: 'INR',
    difficulty: 'Hard',
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    minNeuronScore: 500,
    participantCount: 8,
    ndaRequired: false,
    status: 'open',
  },
  {
    id: 'b4',
    type: 'Bounty',
    title: 'RAG Pipeline Optimisation for Legal Document Search',
    description: 'Optimise our existing RAG pipeline to achieve sub-100ms retrieval on 5M+ legal documents with hybrid BM25 + dense search.',
    company: 'LegalTech India',
    companyInitials: 'LT',
    companyColor: '#10B981',
    companyVerified: false,
    skills: ['LangChain', 'Pinecone', 'BM25', 'FastAPI'],
    reward: 60000,
    currency: 'INR',
    difficulty: 'Advanced',
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    minNeuronScore: 400,
    participantCount: 5,
    ndaRequired: false,
    status: 'open',
  },
  {
    id: 'b5',
    type: 'Bounty',
    title: 'AI-Powered Code Review Bot for GitHub PRs',
    description: 'Build a GitHub App that automatically reviews PRs using Claude/GPT-4, flags security issues, and suggests improvements.',
    company: 'DevTools Co',
    companyInitials: 'DT',
    companyColor: '#00D4FF',
    companyVerified: false,
    skills: ['GitHub API', 'LLM', 'Node.js', 'TypeScript'],
    reward: 45000,
    currency: 'INR',
    difficulty: 'Intermediate',
    deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    minNeuronScore: 300,
    participantCount: 12,
    ndaRequired: false,
    status: 'open',
  },
  {
    id: 'b6',
    type: 'Contest',
    title: 'Indic Language NER Model — Best F1 Score Wins',
    description: 'Train a Named Entity Recognition model for 5 Indic languages. Highest F1 score on our test set wins ₹60,000.',
    company: 'Sarvam AI',
    companyInitials: 'SA',
    companyColor: '#00D4FF',
    companyVerified: true,
    skills: ['HuggingFace', 'NLP', 'Python', 'Indic Languages'],
    reward: 60000,
    currency: 'INR',
    difficulty: 'Advanced',
    deadline: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
    minNeuronScore: 550,
    participantCount: 22,
    ndaRequired: false,
    status: 'open',
  },
];

export const MOCK_BOUNTY_DETAIL: BountyDetail = {
  ...MOCK_BOUNTIES[0],
  problemStatement: `Our customer support team handles 50,000+ queries daily across Hindi, Tamil, and English. Current IVR system has 67% resolution rate and average handle time of 8 minutes. We need an AI voice agent that can understand natural speech in all three languages, handle context across turns, and resolve common queries without human escalation.`,
  currentState: `We have a basic rule-based IVR system built on Twilio. It handles ~30% of queries automatically. The rest require human agents. We have 18 months of call transcripts (anonymised) available for training.`,
  expectedOutcome: `A production-ready voice AI agent deployed on our infrastructure that achieves 90%+ first-call resolution for the top 50 query types, with sub-1 second response latency and support for Hindi, Tamil, and English.`,
  successCriteria: [
    '90%+ accuracy on our test dataset of 5,000 labelled queries',
    'Sub-1 second end-to-end latency (speech-in to speech-out)',
    'Handles context across minimum 10 conversation turns',
    'Graceful fallback to human agent when confidence < 0.7',
    'Deployed and load-tested at 500 concurrent calls',
  ],
  deliverables: [
    { title: 'Trained AI Model', description: 'Fine-tuned multilingual model with evaluation report' },
    { title: 'Voice Pipeline', description: 'STT → LLM → TTS pipeline with Twilio integration' },
    { title: 'API Documentation', description: 'Complete API reference and deployment guide' },
    { title: 'Load Test Report', description: 'Performance benchmarks at 500 concurrent calls' },
    { title: 'Source Code', description: 'Clean, documented code in private GitHub repo' },
  ],
  techRequirements: ['Python 3.11+', 'FastAPI', 'WebSockets', 'Twilio', 'Hindi/Tamil NLP', 'Docker', 'AWS'],
  accessProvided: ['18 months of anonymised call transcripts', 'Twilio sandbox account', 'AWS credits ($500)', 'Access to our staging environment'],
  aiEstimatedDays: [12, 18],
  aiSuggestedReward: [120000, 180000],
  aiRecommendedType: 'Bounty',
  aiPostingQuality: 8.4,
  questions: [
    {
      id: 'q1',
      question: 'Are the call transcripts already segmented by language, or do we need to detect language ourselves?',
      askedBy: 'Arjun S.',
      askedAt: '2 days ago',
      answer: 'The transcripts include a language field. About 60% Hindi, 25% English, 15% Tamil.',
      answeredAt: '1 day ago',
      isPublic: true,
    },
    {
      id: 'q2',
      question: 'Is there a preference for open-source models vs commercial APIs (OpenAI, Anthropic)?',
      askedBy: 'Priya N.',
      askedAt: '1 day ago',
      answer: 'We prefer open-source for the core model but commercial APIs for fallback are acceptable.',
      answeredAt: '18 hours ago',
      isPublic: true,
    },
  ],
};

// ─── Mini-gate MCQ questions ──────────────────────────────────
export const MINI_GATE_QUESTIONS = Array.from({ length: 10 }, (_, i) => ({
  id: `mg${i + 1}`,
  number: i + 1,
  text: `Mini-Gate Question ${i + 1}: Which approach best handles multilingual intent classification in a low-resource setting?`,
  options: [
    'Fine-tune a multilingual model like mBERT on translated data',
    'Train separate monolingual models for each language',
    'Use zero-shot classification with a large multilingual LLM',
    'Apply cross-lingual transfer learning with language-agnostic embeddings',
  ],
  selectedOption: null as number | null,
}));

// ─── Task categories ──────────────────────────────────────────
export const TASK_CATEGORIES = [
  'LLM / Generative AI', 'Computer Vision', 'NLP', 'MLOps', 'Data Engineering',
  'Recommendation Systems', 'Speech AI', 'Reinforcement Learning', 'Time Series',
  'Graph Neural Networks', 'RAG / Search', 'AI Agents', 'Fine-tuning', 'Deployment',
];

export const NEURON_SCORE_TIERS: { min: number; max: number; tier: string; color: string }[] = [
  { min: 0,   max: 399,  tier: 'Conditional',   color: '#4A5568' },
  { min: 400, max: 599,  tier: 'Verified',       color: '#7B5EA7' },
  { min: 600, max: 799,  tier: 'Professional',   color: '#00D4FF' },
  { min: 800, max: 1000, tier: 'Elite',           color: '#F59E0B' },
];

export function getTierForScore(score: number) {
  return NEURON_SCORE_TIERS.find((t) => score >= t.min && score <= t.max) ?? NEURON_SCORE_TIERS[0];
}

export function formatReward(amount: number, currency = 'INR'): string {
  if (currency === 'INR') {
    return `₹${amount.toLocaleString('en-IN')}`;
  }
  return `$${amount.toLocaleString()}`;
}

export function getDeadlineLabel(deadline: Date): { label: string; urgent: boolean } {
  const diff = deadline.getTime() - Date.now();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (diff <= 0) return { label: 'Expired', urgent: true };
  if (hours < 48) return { label: `${hours}h left`, urgent: true };
  if (days < 7) return { label: `${days} days left`, urgent: false };
  if (days < 30) return { label: `${days} days left`, urgent: false };
  return { label: `${days} days left`, urgent: false };
}

export function formatCountdown(deadline: Date): string {
  const diff = Math.max(0, deadline.getTime() - Date.now());
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${String(d).padStart(2, '0')}d ${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
}
