/**
 * Mock data for Hiring, Contracts & Messaging (Module 6).
 */

export type HiringMode = 'full_time' | 'internship' | 'hourly' | 'project';
export type ContractStatus = 'draft' | 'pending_signature' | 'active' | 'completed' | 'terminated' | 'disputed';
export type MilestoneStatus = 'upcoming' | 'in_progress' | 'submitted' | 'approved' | 'paid';
export type DisputeStatus = 'raised' | 'evidence_submitted' | 'ai_audit' | 'mediator_review' | 'resolved';
export type MessageRequestStatus = 'pending' | 'accepted' | 'declined';
export type AvailabilityStatus = 'available_now' | 'within_2_weeks' | 'any';

// ─── Engineer search ──────────────────────────────────────────
export interface SearchEngineer {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
  headline: string;
  neuronScore: number;
  tier: 'Elite' | 'Professional' | 'Verified' | 'Conditional';
  skills: string[];
  rating: number;
  projectCount: number;
  reviewCount: number;
  hourlyRateINR: number;
  availability: AvailabilityStatus;
  workMode: 'remote' | 'hybrid' | 'onsite';
  emailVerified: boolean;
  kycVerified: boolean;
  matchScore?: number;
}

export const MOCK_ENGINEERS: SearchEngineer[] = [
  {
    id: 'eng-1', name: 'Arjun Sharma', initials: 'AS', avatarColor: '#F59E0B',
    headline: 'LLM Engineer · RAG Systems · Agentic AI',
    neuronScore: 920, tier: 'Elite',
    skills: ['LangChain', 'PyTorch', 'FastAPI', 'LlamaIndex', 'OpenAI'],
    rating: 4.97, projectCount: 28, reviewCount: 43,
    hourlyRateINR: 4500, availability: 'available_now', workMode: 'remote',
    emailVerified: true, kycVerified: true, matchScore: 94,
  },
  {
    id: 'eng-2', name: 'Priya Nair', initials: 'PN', avatarColor: '#00D4FF',
    headline: 'ML Engineer · Computer Vision · MLOps',
    neuronScore: 845, tier: 'Professional',
    skills: ['TensorFlow', 'Kubernetes', 'OpenCV', 'MLflow', 'AWS'],
    rating: 4.9, projectCount: 22, reviewCount: 31,
    hourlyRateINR: 3800, availability: 'available_now', workMode: 'remote',
    emailVerified: true, kycVerified: true, matchScore: 87,
  },
  {
    id: 'eng-3', name: 'Rahul Verma', initials: 'RV', avatarColor: '#7B5EA7',
    headline: 'AI Product Engineer · Fine-tuning · Agents',
    neuronScore: 780, tier: 'Professional',
    skills: ['OpenAI', 'Pinecone', 'Next.js', 'HuggingFace', 'Docker'],
    rating: 4.8, projectCount: 18, reviewCount: 24,
    hourlyRateINR: 3200, availability: 'within_2_weeks', workMode: 'hybrid',
    emailVerified: true, kycVerified: false, matchScore: 81,
  },
  {
    id: 'eng-4', name: 'Sneha Patel', initials: 'SP', avatarColor: '#10B981',
    headline: 'Data Scientist · NLP · Recommendation Systems',
    neuronScore: 810, tier: 'Professional',
    skills: ['HuggingFace', 'Spark', 'dbt', 'Python', 'SQL'],
    rating: 4.85, projectCount: 20, reviewCount: 28,
    hourlyRateINR: 3500, availability: 'available_now', workMode: 'remote',
    emailVerified: true, kycVerified: true, matchScore: 76,
  },
  {
    id: 'eng-5', name: 'Kiran Reddy', initials: 'KR', avatarColor: '#EF4444',
    headline: 'MLOps Engineer · Kubernetes · Model Serving',
    neuronScore: 720, tier: 'Verified',
    skills: ['Kubernetes', 'vLLM', 'Triton', 'Prometheus', 'Grafana'],
    rating: 4.7, projectCount: 15, reviewCount: 19,
    hourlyRateINR: 2800, availability: 'within_2_weeks', workMode: 'remote',
    emailVerified: true, kycVerified: false, matchScore: 68,
  },
  {
    id: 'eng-6', name: 'Ananya Singh', initials: 'AN', avatarColor: '#F59E0B',
    headline: 'Generative AI · Stable Diffusion · Creative AI',
    neuronScore: 650, tier: 'Verified',
    skills: ['Stable Diffusion', 'ComfyUI', 'Python', 'FastAPI', 'AWS'],
    rating: 4.6, projectCount: 12, reviewCount: 15,
    hourlyRateINR: 2200, availability: 'any', workMode: 'onsite',
    emailVerified: true, kycVerified: false,
  },
];

// ─── Contracts ────────────────────────────────────────────────
export interface Milestone {
  id: string;
  number: number;
  title: string;
  description: string;
  dueDate: string;
  amount: number;
  status: MilestoneStatus;
  submittedAt?: string;
  approvedAt?: string;
  paidAt?: string;
  autoApproveAt?: string; // 72h after submission
}

export interface Contract {
  id: string;
  title: string;
  mode: HiringMode;
  status: ContractStatus;
  companyName: string;
  companyInitials: string;
  companyColor: string;
  engineerName: string;
  engineerInitials: string;
  engineerColor: string;
  totalAmount: number;
  platformFee: number;
  engineerTakeHome: number;
  currency: string;
  startDate: string;
  endDate?: string;
  milestones: Milestone[];
  contractPdfUrl?: string;
  ndaRequired: boolean;
  companySigned: boolean;
  engineerSigned: boolean;
  companySignedAt?: string;
  engineerSignedAt?: string;
  escrowFunded: boolean;
  escrowReleased: number;
  disputeStatus?: DisputeStatus;
}

export const MOCK_CONTRACT: Contract = {
  id: 'contract-1',
  title: 'Build Multilingual Voice AI Agent',
  mode: 'project',
  status: 'active',
  companyName: 'Sarvam AI',
  companyInitials: 'SA',
  companyColor: '#00D4FF',
  engineerName: 'Arjun Sharma',
  engineerInitials: 'AS',
  engineerColor: '#F59E0B',
  totalAmount: 150000,
  platformFee: 15000,
  engineerTakeHome: 135000,
  currency: 'INR',
  startDate: '2024-11-01',
  endDate: '2024-12-31',
  ndaRequired: true,
  companySigned: true,
  engineerSigned: true,
  companySignedAt: '2024-11-01T10:00:00Z',
  engineerSignedAt: '2024-11-01T14:30:00Z',
  escrowFunded: true,
  escrowReleased: 50000,
  milestones: [
    {
      id: 'm1', number: 1,
      title: 'STT + LLM Pipeline',
      description: 'Speech-to-text pipeline with multilingual LLM integration',
      dueDate: '2024-11-15', amount: 50000,
      status: 'paid', paidAt: '2024-11-16T09:00:00Z',
    },
    {
      id: 'm2', number: 2,
      title: 'TTS + Twilio Integration',
      description: 'Text-to-speech and Twilio voice channel integration',
      dueDate: '2024-11-30', amount: 50000,
      status: 'submitted',
      submittedAt: new Date(Date.now() - 12 * 3600000).toISOString(),
      autoApproveAt: new Date(Date.now() + 60 * 3600000).toISOString(),
    },
    {
      id: 'm3', number: 3,
      title: 'Load Testing & Deployment',
      description: 'Load test at 500 concurrent calls, deploy to production',
      dueDate: '2024-12-15', amount: 50000,
      status: 'upcoming',
    },
  ],
};

// ─── Messages ─────────────────────────────────────────────────
export type MessageType = 'text' | 'file' | 'system';

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderInitials: string;
  senderColor: string;
  content: string;
  type: MessageType;
  timestamp: Date;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  type: 'direct' | 'project_room' | 'request';
  name: string;
  initials: string;
  avatarColor: string;
  lastMessage: string;
  lastMessageAt: Date;
  unreadCount: number;
  requestStatus?: MessageRequestStatus;
  contractId?: string;
  bountyId?: string;
  messages: Message[];
  isTyping?: boolean;
}

const NOW = Date.now();

export const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv-1',
    type: 'project_room',
    name: 'Sarvam AI — Voice Agent',
    initials: 'SA',
    avatarColor: '#00D4FF',
    lastMessage: 'The STT pipeline is ready for review',
    lastMessageAt: new Date(NOW - 2 * 3600000),
    unreadCount: 3,
    contractId: 'contract-1',
    messages: [
      {
        id: 'msg-1', senderId: 'company-1', senderName: 'Vikram Nair',
        senderInitials: 'VN', senderColor: '#00D4FF',
        content: 'Hi Arjun, can you share the progress on the STT pipeline?',
        type: 'text', timestamp: new Date(NOW - 5 * 3600000), read: true,
      },
      {
        id: 'msg-2', senderId: 'eng-1', senderName: 'Arjun Sharma',
        senderInitials: 'AS', senderColor: '#F59E0B',
        content: 'Sure! I\'ve completed the Hindi and English models. Tamil is 80% done.',
        type: 'text', timestamp: new Date(NOW - 4 * 3600000), read: true,
      },
      {
        id: 'msg-3', senderId: 'eng-1', senderName: 'Arjun Sharma',
        senderInitials: 'AS', senderColor: '#F59E0B',
        content: 'architecture-diagram.pdf',
        type: 'file', timestamp: new Date(NOW - 4 * 3600000 + 60000),
        fileUrl: '/files/arch.pdf', fileName: 'architecture-diagram.pdf',
        fileSize: 2400000, fileType: 'application/pdf', read: true,
      },
      {
        id: 'msg-4', senderId: 'company-1', senderName: 'Vikram Nair',
        senderInitials: 'VN', senderColor: '#00D4FF',
        content: 'The STT pipeline is ready for review',
        type: 'text', timestamp: new Date(NOW - 2 * 3600000), read: false,
      },
    ],
  },
  {
    id: 'conv-2',
    type: 'direct',
    name: 'Priya Menon',
    initials: 'PM',
    avatarColor: '#7B5EA7',
    lastMessage: 'Thanks for the quick turnaround!',
    lastMessageAt: new Date(NOW - 24 * 3600000),
    unreadCount: 0,
    messages: [
      {
        id: 'msg-5', senderId: 'company-2', senderName: 'Priya Menon',
        senderInitials: 'PM', senderColor: '#7B5EA7',
        content: 'Thanks for the quick turnaround!',
        type: 'text', timestamp: new Date(NOW - 24 * 3600000), read: true,
      },
    ],
  },
  {
    id: 'conv-3',
    type: 'request',
    name: 'Zepto Engineering',
    initials: 'ZP',
    avatarColor: '#F59E0B',
    lastMessage: 'Hi, we\'d like to discuss a demand forecasting project',
    lastMessageAt: new Date(NOW - 48 * 3600000),
    unreadCount: 1,
    requestStatus: 'pending',
    messages: [
      {
        id: 'msg-6', senderId: 'company-3', senderName: 'Zepto Engineering',
        senderInitials: 'ZP', senderColor: '#F59E0B',
        content: 'Hi, we\'d like to discuss a demand forecasting project with you.',
        type: 'text', timestamp: new Date(NOW - 48 * 3600000), read: false,
      },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatMessageTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  if (days === 1) return 'Yesterday';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function formatDateDivider(date: Date): string {
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

// Off-platform detection patterns
const OFF_PLATFORM_PATTERNS = [
  /\b\d{10}\b/,                          // 10-digit phone
  /\b\+91\s?\d{10}\b/,                   // +91 phone
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/, // email
  /\bwhatsapp\b/i,
  /\btelegram\b/i,
];

export function detectOffPlatform(text: string): boolean {
  return OFF_PLATFORM_PATTERNS.some((p) => p.test(text));
}

export function getMilestoneStatusColor(status: MilestoneStatus): string {
  const colors: Record<MilestoneStatus, string> = {
    upcoming:    '#4A5568',
    in_progress: '#00D4FF',
    submitted:   '#F59E0B',
    approved:    '#10B981',
    paid:        '#10B981',
  };
  return colors[status];
}

export function formatCountdown72h(submittedAt: string): string {
  const deadline = new Date(new Date(submittedAt).getTime() + 72 * 3600000);
  const diff = Math.max(0, deadline.getTime() - Date.now());
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return `${h}h ${m}m`;
}
