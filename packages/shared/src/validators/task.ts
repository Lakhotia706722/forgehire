import { z } from 'zod';

// Task Creation Validators
export const taskDeliverableSchema = z.object({
  title: z.string().min(3, 'Deliverable title must be at least 3 characters').max(200),
  description: z.string().min(10, 'Deliverable description must be at least 10 characters').max(1000),
  acceptanceCriteria: z.array(z.string()).optional()
});

export const taskSelectionCriterionSchema = z.object({
  name: z.string().min(2).max(100),
  weight: z.number().min(0).max(100),
  description: z.string().max(500).optional()
});

export const contestRankSchema = z.object({
  rank: z.number().min(1),
  percentage: z.number().min(0).max(100)
});

export const createTaskSchema = z.object({
  // Basic info
  title: z.string().min(10, 'Title must be at least 10 characters').max(200),
  type: z.enum(['bounty', 'direct', 'contest']),
  category: z.array(z.string()).min(1, 'At least one category is required').max(5),
  problemStatement: z.string().min(50, 'Problem statement must be at least 50 characters').max(10000),
  currentState: z.string().max(5000).optional().nullable(),
  expectedOutcome: z.string().min(30, 'Expected outcome must be at least 30 characters').max(5000),
  deliverables: z.array(taskDeliverableSchema).min(1, 'At least one deliverable is required').max(20),
  techRequirements: z.array(z.string()).min(1, 'At least one tech requirement is required').max(20),
  
  // Timeline & Reward
  timeline: z.number().min(1, 'Timeline must be at least 1 day').max(365),
  rewardAmount: z.number().min(1000, 'Reward must be at least ₹1,000').max(10000000),
  paymentType: z.enum(['fixed', 'hourly', 'milestone']),
  currency: z.string().default('INR'),
  
  // Selection & Requirements
  selectionCriteria: z.array(taskSelectionCriterionSchema).min(1, 'At least one selection criterion is required').max(10),
  minNeuronScore: z.number().min(0).max(1000).default(0),
  ndaRequired: z.boolean().default(false),
  difficulty: z.enum(['easy', 'medium', 'hard', 'expert']),
  
  // Contest specific
  isContest: z.boolean().default(false),
  contestRanks: z.array(contestRankSchema).optional().nullable(),
  maxWinners: z.number().min(1).max(10).optional().nullable()
}).refine(
  (data) => {
    if (data.type === 'contest' || data.isContest) {
      return data.contestRanks && data.contestRanks.length > 0 && data.maxWinners && data.maxWinners > 0;
    }
    return true;
  },
  { message: 'Contest tasks must have contestRanks and maxWinners defined' }
).refine(
  (data) => {
    if (data.contestRanks) {
      const totalPercentage = data.contestRanks.reduce((sum, rank) => sum + rank.percentage, 0);
      return Math.abs(totalPercentage - 100) < 0.01; // Allow for floating point errors
    }
    return true;
  },
  { message: 'Contest rank percentages must sum to 100%' }
);

export const updateTaskSchema = z.object({
  title: z.string().min(10).max(200).optional(),
  type: z.enum(['bounty', 'direct', 'contest']).optional(),
  category: z.array(z.string()).min(1).max(5).optional(),
  problemStatement: z.string().min(50).max(10000).optional(),
  currentState: z.string().max(5000).optional().nullable(),
  expectedOutcome: z.string().min(30).max(5000).optional(),
  deliverables: z.array(taskDeliverableSchema).min(1).max(20).optional(),
  techRequirements: z.array(z.string()).min(1).max(20).optional(),
  timeline: z.number().min(1).max(365).optional(),
  rewardAmount: z.number().min(1000).max(10000000).optional(),
  paymentType: z.enum(['fixed', 'hourly', 'milestone']).optional(),
  currency: z.string().optional(),
  selectionCriteria: z.array(taskSelectionCriterionSchema).min(1).max(10).optional(),
  minNeuronScore: z.number().min(0).max(1000).optional(),
  ndaRequired: z.boolean().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard', 'expert']).optional(),
  isContest: z.boolean().optional(),
  contestRanks: z.array(contestRankSchema).optional().nullable(),
  maxWinners: z.number().min(1).max(10).optional().nullable()
});

// Escrow Validators
export const depositEscrowSchema = z.object({
  taskId: z.string().uuid(),
  paymentId: z.string().min(1, 'Payment ID is required'),
  orderId: z.string().min(1, 'Order ID is required'),
  signature: z.string().min(1, 'Signature is required')
});

// Participation Validators
export const participateTaskSchema = z.object({
  approach: z.string().min(50, 'Approach must be at least 50 characters').max(5000),
  estimatedTime: z.number().min(1).max(365).optional().nullable(),
  proposedRate: z.number().min(0).max(100000).optional().nullable()
});

// Submission Validators
export const submitTaskSchema = z.object({
  description: z.string().min(50, 'Description must be at least 50 characters').max(10000),
  demoUrl: z.string().url('Invalid demo URL').optional().nullable(),
  githubUrl: z.string().url('Invalid GitHub URL').optional().nullable(),
  codeUrl: z.string().url('Invalid code URL').optional().nullable(),
  screenshots: z.array(z.string().url()).max(20, 'Maximum 20 screenshots allowed').optional(),
  videoUrl: z.string().url('Invalid video URL').optional().nullable(),
  performanceMetrics: z.record(z.any()).optional().nullable(),
  architectureDiagram: z.string().url('Invalid architecture diagram URL').optional().nullable()
});

// Evaluation Validators
export const evaluateSubmissionSchema = z.object({
  submissionId: z.string().uuid(),
  score: z.number().min(0).max(100),
  feedback: z.string().min(10, 'Feedback must be at least 10 characters').max(5000).optional().nullable(),
  criteriaScores: z.record(z.number().min(0).max(100)).optional().nullable()
});

export const selectWinnerSchema = z.object({
  submissionId: z.string().uuid(),
  rank: z.number().min(1).optional().nullable() // For contests
});

export const selectMultipleWinnersSchema = z.object({
  winners: z.array(z.object({
    submissionId: z.string().uuid(),
    rank: z.number().min(1)
  })).min(1, 'At least one winner is required').max(10)
});

// Question Validators
export const askQuestionSchema = z.object({
  question: z.string().min(10, 'Question must be at least 10 characters').max(2000),
  isPublic: z.boolean().default(true)
});

export const answerQuestionSchema = z.object({
  answer: z.string().min(10, 'Answer must be at least 10 characters').max(5000)
});

// NDA Validators
export const signNDASchema = z.object({
  signature: z.string().min(10, 'Signature data is required'),
  ipAddress: z.string().ip('Invalid IP address')
});

// Search & Filter Validators
export const taskSearchSchema = z.object({
  // Filters
  type: z.enum(['bounty', 'direct', 'contest']).optional(),
  category: z.array(z.string()).optional(),
  difficulty: z.enum(['easy', 'medium', 'hard', 'expert']).optional(),
  minReward: z.coerce.number().min(0).optional(),
  maxReward: z.coerce.number().min(0).optional(),
  minNeuronScore: z.coerce.number().min(0).max(1000).optional(),
  maxNeuronScore: z.coerce.number().min(0).max(1000).optional(),
  skills: z.array(z.string()).optional(),
  status: z.enum(['draft', 'pending_escrow', 'open', 'in_progress', 'in_review', 'completed', 'cancelled']).optional(),
  ndaRequired: z.boolean().optional(),
  
  // Search
  query: z.string().optional(),
  
  // Sorting
  sortBy: z.enum(['createdAt', 'publishedAt', 'deadline', 'rewardAmount', 'participantCount']).default('publishedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  
  // Pagination
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
}).refine(
  (data) => {
    if (data.minReward && data.maxReward) {
      return data.minReward <= data.maxReward;
    }
    return true;
  },
  { message: 'Min reward must be less than or equal to max reward' }
).refine(
  (data) => {
    if (data.minNeuronScore && data.maxNeuronScore) {
      return data.minNeuronScore <= data.maxNeuronScore;
    }
    return true;
  },
  { message: 'Min NeuronScore must be less than or equal to max NeuronScore' }
);

// Type exports
export type TaskDeliverableInput = z.infer<typeof taskDeliverableSchema>;
export type TaskSelectionCriterionInput = z.infer<typeof taskSelectionCriterionSchema>;
export type ContestRankInput = z.infer<typeof contestRankSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type DepositEscrowInput = z.infer<typeof depositEscrowSchema>;
export type ParticipateTaskInput = z.infer<typeof participateTaskSchema>;
export type SubmitTaskInput = z.infer<typeof submitTaskSchema>;
export type EvaluateSubmissionInput = z.infer<typeof evaluateSubmissionSchema>;
export type SelectWinnerInput = z.infer<typeof selectWinnerSchema>;
export type SelectMultipleWinnersInput = z.infer<typeof selectMultipleWinnersSchema>;
export type AskQuestionInput = z.infer<typeof askQuestionSchema>;
export type AnswerQuestionInput = z.infer<typeof answerQuestionSchema>;
export type SignNDAInput = z.infer<typeof signNDASchema>;
export type TaskSearchInput = z.infer<typeof taskSearchSchema>;
