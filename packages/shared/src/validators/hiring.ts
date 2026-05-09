import { z } from 'zod';

// Job Posting Validators
export const createJobPostingSchema = z.object({
  title: z.string().min(10).max(200),
  description: z.string().min(50).max(10000),
  hiringMode: z.enum(['full_time', 'internship', 'hourly_contract', 'project_contract']),
  requiredSkills: z.array(z.string()).min(1).max(20),
  experienceLevel: z.enum(['junior', 'mid', 'senior', 'expert']),
  budgetMin: z.number().positive().optional(),
  budgetMax: z.number().positive().optional(),
  currency: z.string().default('INR'),
  ctcMin: z.number().positive().optional(),
  ctcMax: z.number().positive().optional(),
  duration: z.number().min(1).max(6).optional(),
  stipend: z.number().positive().optional(),
  estimatedHours: z.number().positive().optional(),
  isTimeBoxed: z.boolean().optional(),
  endDate: z.string().datetime().optional(),
  projectScope: z.string().max(5000).optional(),
  milestones: z.array(z.object({
    title: z.string(),
    description: z.string(),
    amount: z.number().positive(),
    dueDate: z.string().datetime().optional()
  })).optional(),
  location: z.string().optional(),
  isRemote: z.boolean().optional()
});

export const jobSearchSchema = z.object({
  hiringMode: z.enum(['full_time', 'internship', 'hourly_contract', 'project_contract']).optional(),
  skills: z.array(z.string()).optional(),
  experienceLevel: z.enum(['junior', 'mid', 'senior', 'expert']).optional(),
  minBudget: z.number().positive().optional(),
  maxBudget: z.number().positive().optional(),
  isRemote: z.boolean().optional(),
  location: z.string().optional(),
  query: z.string().optional(),
  limit: z.number().min(1).max(50).optional(),
  cursor: z.string().optional()
});

export const applyToJobSchema = z.object({
  coverLetter: z.string().min(100).max(2000),
  proposedRate: z.number().positive().optional(),
  availability: z.enum(['immediate', '2_weeks', '1_month']).optional()
});

// Contract Validators
export const createContractSchema = z.object({
  jobPostingId: z.string().uuid().optional(),
  companyProfileId: z.string().uuid(),
  engineerProfileId: z.string().uuid(),
  companyUserId: z.string().uuid(),
  engineerUserId: z.string().uuid(),
  hiringMode: z.enum(['full_time', 'internship', 'hourly_contract', 'project_contract']),
  title: z.string().min(10).max(200),
  scope: z.string().min(50).max(10000),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  rate: z.number().positive(),
  currency: z.string().default('INR'),
  ctc: z.number().positive().optional(),
  stipendAmount: z.number().positive().optional(),
  durationMonths: z.number().min(1).max(6).optional(),
  hourlyRate: z.number().positive().optional(),
  estimatedHours: z.number().positive().optional(),
  totalAmount: z.number().positive().optional(),
  milestones: z.array(z.object({
    title: z.string(),
    description: z.string(),
    amount: z.number().positive(),
    dueDate: z.string().datetime().optional(),
    deliverables: z.array(z.string()).optional()
  })).optional(),
  ipOwnership: z.enum(['company', 'engineer', 'shared']).optional(),
  ndaRequired: z.boolean().optional(),
  confidentialityTerms: z.string().optional(),
  trialMode: z.boolean().optional()
});

export const signContractSchema = z.object({
  signature: z.string().min(10),
  ipAddress: z.string()
});

export const createAmendmentSchema = z.object({
  reason: z.string().min(20).max(1000),
  changes: z.record(z.any())
});

export const completeTrialSchema = z.object({
  extend: z.boolean()
});

// Time Entry Validators
export const logHoursSchema = z.object({
  contractId: z.string().uuid(),
  date: z.string().datetime(),
  hoursLogged: z.number().min(0.5).max(24),
  description: z.string().min(10).max(1000)
});

export const fundWalletSchema = z.object({
  amount: z.number().positive(),
  paymentDetails: z.object({
    orderId: z.string(),
    paymentId: z.string(),
    signature: z.string()
  })
});

// Milestone Validators
export const submitMilestoneSchema = z.object({
  submissionNotes: z.string().min(20).max(2000),
  deliverables: z.array(z.object({
    title: z.string(),
    url: z.string().url()
  })).optional()
});

export const approveMilestoneSchema = z.object({
  approvalNotes: z.string().max(1000).optional()
});

// Messaging Validators
export const sendMessageRequestSchema = z.object({
  toUserId: z.string().uuid(),
  message: z.string().min(20).max(500)
});

export const respondToMessageRequestSchema = z.object({
  approve: z.boolean()
});

export const sendMessageSchema = z.object({
  recipientId: z.string().uuid(),
  content: z.string().min(1).max(5000),
  fileUrl: z.string().url().optional(),
  fileName: z.string().optional(),
  fileSize: z.number().optional()
});

export const sendProjectChatMessageSchema = z.object({
  content: z.string().min(1).max(5000),
  fileUrl: z.string().url().optional(),
  fileName: z.string().optional()
});

// Availability Validators
export const setAvailabilitySlotsSchema = z.object({
  slots: z.array(z.object({
    startTime: z.string().datetime(),
    endTime: z.string().datetime()
  })).min(1).max(50)
});

export const bookSlotSchema = z.object({
  meetingLink: z.string().url().optional(),
  meetingNotes: z.string().max(500).optional()
});

export const generateWeeklySlotsSchema = z.object({
  weekStart: z.string().datetime(),
  timeSlots: z.array(z.object({
    dayOfWeek: z.number().min(0).max(6),
    startHour: z.number().min(0).max(23),
    startMinute: z.number().min(0).max(59)
  })).min(1)
});

// Team Builder Validator
export const buildTeamSchema = z.object({
  problemDescription: z.string().min(50).max(2000),
  requiredSkills: z.array(z.string()).min(1).max(20),
  budget: z.number().positive()
});

// Type exports
export type CreateJobPostingInput = z.infer<typeof createJobPostingSchema>;
export type JobSearchInput = z.infer<typeof jobSearchSchema>;
export type ApplyToJobInput = z.infer<typeof applyToJobSchema>;
export type CreateContractInput = z.infer<typeof createContractSchema>;
export type SignContractInput = z.infer<typeof signContractSchema>;
export type CreateAmendmentInput = z.infer<typeof createAmendmentSchema>;
export type CompleteTrialInput = z.infer<typeof completeTrialSchema>;
export type LogHoursInput = z.infer<typeof logHoursSchema>;
export type FundWalletInput = z.infer<typeof fundWalletSchema>;
export type SubmitMilestoneInput = z.infer<typeof submitMilestoneSchema>;
export type ApproveMilestoneInput = z.infer<typeof approveMilestoneSchema>;
export type SendMessageRequestInput = z.infer<typeof sendMessageRequestSchema>;
export type RespondToMessageRequestInput = z.infer<typeof respondToMessageRequestSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type SendProjectChatMessageInput = z.infer<typeof sendProjectChatMessageSchema>;
export type SetAvailabilitySlotsInput = z.infer<typeof setAvailabilitySlotsSchema>;
export type BookSlotInput = z.infer<typeof bookSlotSchema>;
export type GenerateWeeklySlotsInput = z.infer<typeof generateWeeklySlotsSchema>;
export type BuildTeamInput = z.infer<typeof buildTeamSchema>;
