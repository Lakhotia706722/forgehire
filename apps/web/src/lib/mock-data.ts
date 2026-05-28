/**
 * Mock data for public profile pages.
 * In production these would be fetched from the API via server components.
 */

export type TierName = 'Elite' | 'Professional' | 'Verified' | 'Conditional';

export interface EngineerProfile {
  id: string;
  name: string;
  headline: string;
  bio: string;
  location: string;
  avatarInitials: string;
  avatarColor: string;
  neuronScore: number;
  tier: TierName;
  hourlyRateINR: number;
  hourlyRateUSD: number;
  availability: 'available' | 'soon' | 'unavailable';
  availabilityLabel: string;
  rating: number;
  reviewCount: number;
  projectCount: number;
  responseRate: number;
  avgResponseTime: string;
  emailVerified: boolean;
  kycVerified: boolean;
  skills: Skill[];
  projects: Project[];
  experiences: Experience[];
  techStack: TechCategory[];
  reviews: Review[];
  products: MarketplaceProduct[];
  activities: Activity[];
}

export interface Skill {
  name: string;
  proficiency: 1 | 2 | 3;
  projectCount: number;
  verified: boolean;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  type: 'Agent' | 'SaaS' | 'API' | 'Tool' | 'Model';
  techStack: string[];
  demoUrl?: string;
  metrics: { label: string; value: string }[];
  thumbnailGradient: string;
}

export interface Experience {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string | null;
  current: boolean;
  description: string;
  impact: string[];
  verified: boolean;
  accentColor: string;
}

export interface TechCategory {
  category: string;
  skills: { name: string; proficiency: 1 | 2 | 3; projectCount: number; verified: boolean }[];
}

export interface Review {
  id: string;
  reviewerName: string;
  reviewerCompany: string;
  reviewerInitials: string;
  rating: number;
  text: string;
  projectRef: string;
  date: string;
  verified: boolean;
  engineerResponse?: string;
}

export interface MarketplaceProduct {
  id: string;
  title: string;
  category: string;
  price: string;
  rating: number;
  reviewCount: number;
  gradient: string;
}

export interface Activity {
  id: string;
  text: string;
  timestamp: string;
  likes: number;
}

// ─── Mock engineer ────────────────────────────────────────────
export const MOCK_ENGINEER: EngineerProfile = {
  id: 'arjun-sharma',
  name: 'Arjun Sharma',
  headline: 'LLM Engineer · RAG Systems · Agentic AI',
  bio: 'I build production-grade AI systems that actually work. Specialising in LLM fine-tuning, RAG pipelines, and multi-agent orchestration. 6 years in ML, 3 years focused exclusively on LLMs. Previously at Sarvam AI and Ola Electric.',
  location: 'Bengaluru, India',
  avatarInitials: 'AS',
  avatarColor: '#F59E0B',
  neuronScore: 920,
  tier: 'Elite',
  hourlyRateINR: 4500,
  hourlyRateUSD: 54,
  availability: 'available',
  availabilityLabel: 'Available Now',
  rating: 4.97,
  reviewCount: 43,
  projectCount: 28,
  responseRate: 98,
  avgResponseTime: '< 2 hrs',
  emailVerified: true,
  kycVerified: true,
  skills: [
    { name: 'LangChain', proficiency: 3, projectCount: 14, verified: true },
    { name: 'PyTorch', proficiency: 3, projectCount: 18, verified: true },
    { name: 'FastAPI', proficiency: 3, projectCount: 22, verified: false },
    { name: 'LlamaIndex', proficiency: 3, projectCount: 9, verified: true },
    { name: 'Pinecone', proficiency: 2, projectCount: 7, verified: false },
    { name: 'OpenAI API', proficiency: 3, projectCount: 20, verified: true },
  ],
  projects: [
    {
      id: 'p1',
      title: 'Enterprise RAG Pipeline for Legal Documents',
      description: 'Built a production RAG system processing 2M+ legal documents with sub-200ms retrieval. Handles multi-hop reasoning and citation tracking.',
      type: 'API',
      techStack: ['LangChain', 'Pinecone', 'FastAPI', 'Redis'],
      demoUrl: 'https://demo.example.com',
      metrics: [
        { label: 'Accuracy', value: '94.2%' },
        { label: 'Latency', value: '180ms' },
        { label: 'Docs', value: '2M+' },
      ],
      thumbnailGradient: 'from-[rgba(0,212,255,0.2)] to-[rgba(123,94,167,0.15)]',
    },
    {
      id: 'p2',
      title: 'Multi-Agent Customer Support System',
      description: 'Orchestrated 5 specialised agents (triage, knowledge, escalation, billing, feedback) reducing support tickets by 67%.',
      type: 'Agent',
      techStack: ['AutoGen', 'GPT-4', 'PostgreSQL', 'Celery'],
      demoUrl: 'https://demo.example.com',
      metrics: [
        { label: 'Ticket Reduction', value: '67%' },
        { label: 'CSAT', value: '4.8/5' },
        { label: 'Agents', value: '5' },
      ],
      thumbnailGradient: 'from-[rgba(123,94,167,0.2)] to-[rgba(245,158,11,0.1)]',
    },
    {
      id: 'p3',
      title: 'Fine-tuned LLaMA 3 for Code Review',
      description: 'Fine-tuned LLaMA 3 8B on 500K code review pairs. Achieves GPT-4 level performance at 1/10th the cost.',
      type: 'Model',
      techStack: ['LLaMA 3', 'LoRA', 'vLLM', 'HuggingFace'],
      metrics: [
        { label: 'vs GPT-4', value: '97% parity' },
        { label: 'Cost', value: '10x cheaper' },
        { label: 'Latency', value: '120ms' },
      ],
      thumbnailGradient: 'from-[rgba(16,185,129,0.15)] to-[rgba(0,212,255,0.1)]',
    },
    {
      id: 'p4',
      title: 'Real-time AI Fraud Detection API',
      description: 'Graph neural network-based fraud detection processing 50K transactions/sec with 99.1% precision.',
      type: 'API',
      techStack: ['PyG', 'FastAPI', 'Kafka', 'Redis'],
      metrics: [
        { label: 'Precision', value: '99.1%' },
        { label: 'TPS', value: '50K' },
        { label: 'Latency', value: '8ms' },
      ],
      thumbnailGradient: 'from-[rgba(245,158,11,0.15)] to-[rgba(239,68,68,0.08)]',
    },
  ],
  experiences: [
    {
      id: 'e1',
      company: 'Sarvam AI',
      role: 'Senior LLM Engineer',
      startDate: 'Jan 2023',
      endDate: null,
      current: true,
      description: 'Leading the RAG infrastructure team. Built the core retrieval pipeline serving 10M+ queries/day.',
      impact: ['10M+ queries/day', '40% latency reduction', 'Team of 4'],
      verified: true,
      accentColor: '#00D4FF',
    },
    {
      id: 'e2',
      company: 'Ola Electric',
      role: 'ML Engineer',
      startDate: 'Jun 2021',
      endDate: 'Dec 2022',
      current: false,
      description: 'Built predictive maintenance models for EV battery systems. Reduced unplanned downtime by 35%.',
      impact: ['35% downtime reduction', '₹2Cr saved annually', '50K vehicles'],
      verified: true,
      accentColor: '#7B5EA7',
    },
    {
      id: 'e3',
      company: 'Freelance',
      role: 'AI Consultant',
      startDate: 'Jan 2020',
      endDate: 'May 2021',
      current: false,
      description: 'Delivered 12 AI projects for startups across fintech, healthtech, and edtech.',
      impact: ['12 projects', '8 clients', '100% on-time'],
      verified: false,
      accentColor: '#F59E0B',
    },
  ],
  techStack: [
    {
      category: 'Languages',
      skills: [
        { name: 'Python', proficiency: 3, projectCount: 28, verified: true },
        { name: 'TypeScript', proficiency: 2, projectCount: 8, verified: false },
        { name: 'Rust', proficiency: 1, projectCount: 2, verified: false },
      ],
    },
    {
      category: 'AI / ML Frameworks',
      skills: [
        { name: 'PyTorch', proficiency: 3, projectCount: 18, verified: true },
        { name: 'LangChain', proficiency: 3, projectCount: 14, verified: true },
        { name: 'LlamaIndex', proficiency: 3, projectCount: 9, verified: true },
        { name: 'HuggingFace', proficiency: 3, projectCount: 12, verified: true },
      ],
    },
    {
      category: 'AI Models',
      skills: [
        { name: 'GPT-4 / o1', proficiency: 3, projectCount: 20, verified: false },
        { name: 'LLaMA 3', proficiency: 3, projectCount: 6, verified: false },
        { name: 'Claude 3.5', proficiency: 2, projectCount: 5, verified: false },
        { name: 'Gemini Pro', proficiency: 2, projectCount: 3, verified: false },
      ],
    },
    {
      category: 'Vector DBs',
      skills: [
        { name: 'Pinecone', proficiency: 3, projectCount: 7, verified: false },
        { name: 'Weaviate', proficiency: 2, projectCount: 4, verified: false },
        { name: 'pgvector', proficiency: 2, projectCount: 5, verified: false },
      ],
    },
    {
      category: 'Cloud & Infra',
      skills: [
        { name: 'AWS', proficiency: 3, projectCount: 15, verified: false },
        { name: 'Docker', proficiency: 3, projectCount: 22, verified: false },
        { name: 'Kubernetes', proficiency: 2, projectCount: 8, verified: false },
      ],
    },
    {
      category: 'MLOps',
      skills: [
        { name: 'MLflow', proficiency: 3, projectCount: 10, verified: false },
        { name: 'Weights & Biases', proficiency: 3, projectCount: 12, verified: false },
        { name: 'vLLM', proficiency: 2, projectCount: 4, verified: false },
      ],
    },
  ],
  reviews: [
    {
      id: 'r1',
      reviewerName: 'Vikram Nair',
      reviewerCompany: 'Zepto',
      reviewerInitials: 'VN',
      rating: 5,
      text: 'Arjun delivered an exceptional RAG system that exceeded all our benchmarks. His understanding of production constraints is rare — he optimised for both accuracy and latency simultaneously. Would hire again without hesitation.',
      projectRef: 'Enterprise RAG Pipeline',
      date: 'Nov 2024',
      verified: true,
      engineerResponse: 'Thank you Vikram! The latency challenge was genuinely interesting — happy we found the hybrid retrieval approach that worked.',
    },
    {
      id: 'r2',
      reviewerName: 'Priya Menon',
      reviewerCompany: 'Razorpay',
      reviewerInitials: 'PM',
      rating: 5,
      text: 'Best AI engineer I\'ve worked with. Delivered the fraud detection system 2 weeks early, and the precision numbers are better than what we had with our internal team.',
      projectRef: 'Fraud Detection API',
      date: 'Sep 2024',
      verified: true,
    },
    {
      id: 'r3',
      reviewerName: 'Rohit Gupta',
      reviewerCompany: 'Meesho',
      reviewerInitials: 'RG',
      rating: 4,
      text: 'Great work on the recommendation system. Communication was excellent throughout. Minor delays on the final integration but resolved quickly.',
      projectRef: 'Product Recommendation Engine',
      date: 'Jul 2024',
      verified: true,
    },
  ],
  products: [
    {
      id: 'prod1',
      title: 'RAG Pipeline Starter Kit',
      category: 'API',
      price: '₹4,999',
      rating: 4.9,
      reviewCount: 128,
      gradient: 'from-[rgba(0,212,255,0.15)] to-[rgba(123,94,167,0.1)]',
    },
  ],
  activities: [
    {
      id: 'a1',
      text: 'Just shipped a new version of my RAG kit with hybrid search support (BM25 + dense). Latency dropped 40% on sparse queries. Open to feedback! 🚀',
      timestamp: '2 hours ago',
      likes: 47,
    },
    {
      id: 'a2',
      text: 'Interesting finding: using LLaMA 3 8B with LoRA for domain-specific tasks consistently beats GPT-3.5 at 1/20th the cost. The fine-tuning overhead pays off after ~500 queries/day.',
      timestamp: '1 day ago',
      likes: 134,
    },
    {
      id: 'a3',
      text: 'Completed the Razorpay fraud detection project. 99.1% precision, 8ms p99 latency. Graph neural networks are criminally underused in fintech.',
      timestamp: '3 days ago',
      likes: 89,
    },
  ],
};

// ─── Mock company ─────────────────────────────────────────────
export interface CompanyProfile {
  id: string;
  name: string;
  industry: string;
  description: string;
  logoInitials: string;
  logoColor: string;
  location: string;
  size: string;
  website: string;
  trustScore: number;
  websiteVerified: boolean;
  gstVerified: boolean;
  tasksPosted: number;
  engineersHired: number;
  spendRange: string;
  avgRating: number;
  responseRate: number;
  avgResponseTime: string;
  hiringSuccessRate: number;
  repeatHireRate: number;
  openJobs: OpenJob[];
  openBounties: OpenBounty[];
  pastProjects: PastProject[];
  reviews: CompanyReview[];
}

export interface OpenJob {
  id: string;
  title: string;
  mode: string;
  skills: string[];
  budget: string;
  postedAt: string;
}

export interface OpenBounty {
  id: string;
  title: string;
  reward: string;
  deadline: string;
  difficulty: string;
}

export interface PastProject {
  id: string;
  title: string;
  engineerName: string;
  completedAt: string;
  rating: number;
  outcome: string;
}

export interface CompanyReview {
  id: string;
  engineerName: string;
  engineerInitials: string;
  rating: number;
  text: string;
  date: string;
}

export const MOCK_COMPANY: CompanyProfile = {
  id: 'sarvam-ai',
  name: 'Sarvam AI',
  industry: 'AI Infrastructure',
  description: 'Building India\'s AI stack. We create foundational AI models and infrastructure for Indian languages and use cases. Backed by Lightspeed and Peak XV.',
  logoInitials: 'SA',
  logoColor: '#00D4FF',
  location: 'Bengaluru, India',
  size: '51–200',
  website: 'sarvam.ai',
  trustScore: 94,
  websiteVerified: true,
  gstVerified: true,
  tasksPosted: 47,
  engineersHired: 23,
  spendRange: '₹50L–₹2Cr',
  avgRating: 4.8,
  responseRate: 96,
  avgResponseTime: '< 4 hrs',
  hiringSuccessRate: 91,
  repeatHireRate: 78,
  openJobs: [
    { id: 'j1', title: 'Senior LLM Engineer', mode: 'Full-time', skills: ['LLaMA', 'PyTorch', 'vLLM'], budget: '₹40–60 LPA', postedAt: '2 days ago' },
    { id: 'j2', title: 'MLOps Engineer', mode: 'Contract', skills: ['Kubernetes', 'MLflow', 'AWS'], budget: '₹3,500/hr', postedAt: '5 days ago' },
  ],
  openBounties: [
    { id: 'b1', title: 'Multilingual Voice AI Agent', reward: '₹1,50,000', deadline: '12 days', difficulty: 'Expert' },
    { id: 'b2', title: 'Indic Language NER Model', reward: '₹60,000', deadline: '8 days', difficulty: 'Hard' },
  ],
  pastProjects: [
    { id: 'pp1', title: 'Hindi Speech-to-Text Pipeline', engineerName: 'Arjun Sharma', completedAt: 'Oct 2024', rating: 5, outcome: 'Deployed to production, serving 500K users' },
    { id: 'pp2', title: 'Document Intelligence API', engineerName: 'Priya Nair', completedAt: 'Aug 2024', rating: 5, outcome: 'Processing 2M docs/day' },
  ],
  reviews: [
    { id: 'cr1', engineerName: 'Arjun Sharma', engineerInitials: 'AS', rating: 5, text: 'Excellent company to work with. Clear requirements, fast feedback, and they actually understand the technical constraints. Paid on time, every time.', date: 'Nov 2024' },
    { id: 'cr2', engineerName: 'Priya Nair', engineerInitials: 'PN', rating: 5, text: 'Best client I\'ve had on NeuronHire. They know what they want and give you the autonomy to build it right.', date: 'Sep 2024' },
  ],
};

export const MOCK_ENGINEERS: EngineerProfile[] = [
  MOCK_ENGINEER,
  {
    ...MOCK_ENGINEER,
    id: 'priya-nair',
    name: 'Priya Nair',
    headline: 'MLOps Engineer · LLM Infra · Kubernetes',
    avatarInitials: 'PN',
    avatarColor: '#00D4FF',
    neuronScore: 865,
    tier: 'Professional',
    location: 'Pune, India',
    hourlyRateINR: 3600,
    hourlyRateUSD: 43,
    availability: 'soon',
    availabilityLabel: 'Available in 2 weeks',
    rating: 4.9,
    reviewCount: 31,
    projectCount: 19,
  },
  {
    ...MOCK_ENGINEER,
    id: 'rohit-gupta',
    name: 'Rohit Gupta',
    headline: 'Applied AI Engineer · Vision + NLP',
    avatarInitials: 'RG',
    avatarColor: '#7B5EA7',
    neuronScore: 802,
    tier: 'Verified',
    location: 'Delhi, India',
    hourlyRateINR: 2800,
    hourlyRateUSD: 34,
    availability: 'available',
    availabilityLabel: 'Available Now',
    rating: 4.8,
    reviewCount: 18,
    projectCount: 14,
  },
];

export const MOCK_COMPANIES: CompanyProfile[] = [
  MOCK_COMPANY,
  {
    ...MOCK_COMPANY,
    id: 'zepto-ai',
    name: 'Zepto AI Labs',
    industry: 'Retail AI',
    logoInitials: 'ZA',
    logoColor: '#7B5EA7',
    location: 'Mumbai, India',
    trustScore: 91,
  },
  {
    ...MOCK_COMPANY,
    id: 'finmind',
    name: 'FinMind Systems',
    industry: 'FinTech',
    logoInitials: 'FS',
    logoColor: '#F59E0B',
    location: 'Hyderabad, India',
    trustScore: 88,
  },
];

export function getMockEngineerById(id: string): EngineerProfile | null {
  const lowerId = id.toLowerCase();
  return (
    MOCK_ENGINEERS.find((engineer) => engineer.id.toLowerCase() === lowerId) ??
    null
  );
}

export function getMockCompanyById(id: string): CompanyProfile | null {
  const lowerId = id.toLowerCase();
  return (
    MOCK_COMPANIES.find((company) => company.id.toLowerCase() === lowerId) ??
    null
  );
}
