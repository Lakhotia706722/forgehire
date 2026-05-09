import { z } from 'zod';

export const engineerProfileBasicSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  bio: z.string().max(1000, 'Bio must not exceed 1000 characters').optional().nullable(),
  location: z.string().max(100).optional().nullable(),
  githubUrl: z.string().url('Invalid GitHub URL').optional().nullable(),
  linkedinUrl: z.string().url('Invalid LinkedIn URL').optional().nullable(),
  portfolioUrl: z.string().url('Invalid portfolio URL').optional().nullable(),
  yearsOfExperience: z.number().min(0).max(50).optional().nullable(),
  hourlyRate: z.number().min(0).max(100000).optional().nullable(),
  isAvailable: z.boolean().default(true)
});

export const companyProfileBasicSchema = z.object({
  companyName: z.string().min(2, 'Company name must be at least 2 characters'),
  description: z.string().max(2000, 'Description must not exceed 2000 characters').optional().nullable(),
  website: z.string().url('Invalid website URL').optional().nullable(),
  location: z.string().max(100).optional().nullable(),
  size: z.string().max(50).optional().nullable(),
  industry: z.string().max(100).optional().nullable()
});

export const engineerSkillBasicSchema = z.object({
  skillName: z.string().min(1, 'Skill name is required').max(100),
  proficiencyLevel: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
  yearsOfExperience: z.number().min(0).max(50).optional().nullable()
});

export type EngineerProfileBasicInput = z.infer<typeof engineerProfileBasicSchema>;
export type CompanyProfileBasicInput = z.infer<typeof companyProfileBasicSchema>;
export type EngineerSkillBasicInput = z.infer<typeof engineerSkillBasicSchema>;

