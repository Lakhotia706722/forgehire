import { z } from 'zod';

// Engineer Profile Validators
const emptyToNull = (val: unknown) =>
  val === '' || val === undefined ? null : val;

const emptyToUndefined = (val: unknown) =>
  val === '' || val === null || val === undefined ? undefined : val;

/** Add https:// when missing; empty → null */
const normalizeUrlInput = (val: unknown): string | null => {
  if (val === '' || val === null || val === undefined) return null;
  const s = String(val).trim();
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) return s;
  return `https://${s}`;
};

const optionalUrl = z
  .union([z.string().url(), z.literal('')])
  .transform((v) => (v === '' ? null : v))
  .optional()
  .nullable();

const patchUrl = z.preprocess(
  normalizeUrlInput,
  z.union([z.string().url('Invalid URL'), z.null()]).optional().nullable(),
);

export const engineerBasicInfoSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  headline: z.string().max(200).optional().nullable(),
  bio: z.string().max(1000, 'Bio must not exceed 1000 characters').optional().nullable(),
  location: z.string().max(100).optional().nullable(),
  githubUrl: optionalUrl,
  linkedinUrl: optionalUrl,
  portfolioUrl: optionalUrl,
  yearsOfExperience: z.number().min(0).max(50).optional().nullable()
});

export const engineerSkillSchema = z.object({
  skillName: z.string().min(1, 'Skill name is required').max(100),
  proficiencyLevel: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
  yearsOfExperience: z.number().min(0).max(50).optional().nullable(),
  projectCount: z.number().min(0).default(0),
  verified: z.boolean().default(false)
});

export const engineerProjectSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters').max(5000),
  problemSolved: z.string().min(10, 'Problem description must be at least 10 characters').max(2000),
  techStack: z.array(z.string()).min(1, 'At least one technology is required'),
  demoUrl: z.string().url('Invalid demo URL').optional().nullable(),
  githubUrl: z.string().url('Invalid GitHub URL').optional().nullable(),
  screenshots: z.array(z.string().url()).max(10, 'Maximum 10 screenshots allowed').optional(),
  performanceMetrics: z.record(z.any()).optional().nullable(),
  aiModelUsed: z.string().max(200).optional().nullable(),
  architectureType: z.string().max(200).optional().nullable(),
  featured: z.boolean().default(false)
});

export const engineerExperienceSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').max(200),
  company: z.string().min(2, 'Company name must be at least 2 characters').max(200),
  location: z.string().max(200).optional().nullable(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional().nullable(),
  current: z.boolean().default(false),
  description: z.string().min(10, 'Description must be at least 10 characters').max(5000),
  achievements: z.array(z.string().max(500)).max(20).optional()
});

export const engineerPricingSchema = z.object({
  hourlyRate: z.number().min(0).max(100000).optional().nullable(),
  minHourlyRate: z.number().min(0).max(100000).optional().nullable(),
  maxHourlyRate: z.number().min(0).max(100000).optional().nullable()
}).refine(
  (data) => {
    if (data.minHourlyRate && data.maxHourlyRate) {
      return data.minHourlyRate <= data.maxHourlyRate;
    }
    return true;
  },
  { message: 'Min hourly rate must be less than or equal to max hourly rate' }
);

export const engineerPaymentSchema = z.object({
  upiId: z.string().regex(/^[\w.-]+@[\w.-]+$/, 'Invalid UPI ID format').optional().nullable()
});

export const engineerAvailabilitySchema = z.object({
  availabilityStatus: z.enum(['available_now', 'available_in_weeks', 'not_available']),
  availableInWeeks: z.number().min(1).max(52).optional().nullable()
}).refine(
  (data) => {
    if (data.availabilityStatus === 'available_in_weeks') {
      return data.availableInWeeks !== null && data.availableInWeeks !== undefined;
    }
    return true;
  },
  { message: 'Available in weeks is required when status is available_in_weeks' }
);

/** Single-request update from engineer profile edit page */
export const engineerProfilePatchSchema = z
  .object({
    fullName: z.preprocess(
      emptyToUndefined,
      z
        .string()
        .min(2, 'Full name must be at least 2 characters')
        .optional(),
    ),
    headline: z.preprocess(
      emptyToNull,
      z.string().max(200).optional().nullable(),
    ),
    bio: z.preprocess(
      emptyToNull,
      z.string().max(1000, 'Bio must not exceed 1000 characters').optional().nullable(),
    ),
    location: z.preprocess(
      emptyToNull,
      z.string().max(100).optional().nullable(),
    ),
    githubUrl: patchUrl,
    linkedinUrl: patchUrl,
    portfolioUrl: patchUrl,
    yearsOfExperience: z.number().min(0).max(50).optional().nullable(),
    hourlyRate: z.number().min(0).max(100000).optional().nullable(),
    minHourlyRate: z.number().min(0).max(100000).optional().nullable(),
    maxHourlyRate: z.number().min(0).max(100000).optional().nullable(),
    availabilityStatus: z
      .enum(['available_now', 'available_in_weeks', 'not_available'])
      .optional(),
    availableInWeeks: z.number().min(1).max(52).optional().nullable(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.availabilityStatus === 'available_in_weeks' && data.availableInWeeks == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Enter how many weeks until you are available',
        path: ['availableInWeeks'],
      });
    }
  });

export const buildInPublicActivitySchema = z.object({
  content: z.string().min(10, 'Content must be at least 10 characters').max(1000)
});

// Company Profile Validators
export const companyProfileSchema = z.object({
  companyName: z.string().min(2, 'Company name must be at least 2 characters').max(200),
  description: z.string().max(2000, 'Description must not exceed 2000 characters').optional().nullable(),
  website: z.string().url('Invalid website URL').optional().nullable(),
  logoUrl: z.string().url('Invalid logo URL').optional().nullable(),
  location: z.string().max(100).optional().nullable(),
  size: z.string().max(50).optional().nullable(),
  industry: z.string().max(100).optional().nullable(),
  foundedYear: z.number().min(1800).max(new Date().getFullYear()).optional().nullable(),
  gstNumber: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GST number format').optional().nullable()
});

export const companyHiringSchema = z.object({
  isHiring: z.boolean(),
  hiringIntents: z.array(z.enum(['full_time', 'freelance', 'project', 'bounty'])).optional(),
  aiRequirements: z.array(z.enum(['chatbots', 'automation', 'agents', 'data', 'vision', 'nlp', 'mlops'])).optional()
});

// Search Validators
export const engineerSearchSchema = z.object({
  skills: z.array(z.string()).optional(),
  minNeuronScore: z.number().min(0).max(100).optional(),
  maxNeuronScore: z.number().min(0).max(100).optional(),
  availabilityStatus: z.enum(['available_now', 'available_in_weeks', 'not_available']).optional(),
  minHourlyRate: z.number().min(0).optional(),
  maxHourlyRate: z.number().min(0).optional(),
  location: z.string().optional(),
  neuronTier: z.enum(['elite', 'professional', 'verified', 'conditional']).optional(),
  query: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.number().min(1).max(100).default(20)
});

export const companySearchSchema = z.object({
  industry: z.string().optional(),
  isHiring: z.boolean().optional(),
  minTrustScore: z.number().min(0).max(100).optional(),
  query: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.number().min(1).max(100).default(20)
});

// Type exports
export type EngineerBasicInfoInput = z.infer<typeof engineerBasicInfoSchema>;
export type EngineerSkillInput = z.infer<typeof engineerSkillSchema>;
export type EngineerProjectInput = z.infer<typeof engineerProjectSchema>;
export type EngineerExperienceInput = z.infer<typeof engineerExperienceSchema>;
export type EngineerPricingInput = z.infer<typeof engineerPricingSchema>;
export type EngineerPaymentInput = z.infer<typeof engineerPaymentSchema>;
export type EngineerAvailabilityInput = z.infer<typeof engineerAvailabilitySchema>;
export type EngineerProfilePatchInput = z.infer<typeof engineerProfilePatchSchema>;
export type BuildInPublicActivityInput = z.infer<typeof buildInPublicActivitySchema>;
export type CompanyProfileInput = z.infer<typeof companyProfileSchema>;
export type CompanyHiringInput = z.infer<typeof companyHiringSchema>;
export type EngineerSearchInput = z.infer<typeof engineerSearchSchema>;
export type CompanySearchInput = z.infer<typeof companySearchSchema>;
