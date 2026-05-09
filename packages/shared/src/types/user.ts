export enum UserRole {
  ENGINEER = 'engineer',
  COMPANY = 'company',
  ADMIN = 'admin'
}

export interface User {
  id: string;
  clerkId: string;
  email: string;
  role: UserRole;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface EngineerProfile {
  id: string;
  userId: string;
  fullName: string;
  bio: string | null;
  location: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  portfolioUrl: string | null;
  yearsOfExperience: number | null;
  hourlyRate: number | null;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CompanyProfile {
  id: string;
  userId: string;
  companyName: string;
  description: string | null;
  website: string | null;
  location: string | null;
  size: string | null;
  industry: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface EngineerSkill {
  id: string;
  engineerProfileId: string;
  skillName: string;
  proficiencyLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  yearsOfExperience: number | null;
  createdAt: Date;
  updatedAt: Date;
}
