import type { EngineerProfileData } from '@/lib/api-hooks';

export type EngineerProfileForm = {
  fullName: string;
  headline: string;
  bio: string;
  location: string;
  githubUrl: string;
  linkedinUrl: string;
  portfolioUrl: string;
  hourlyRate: number;
  availabilityStatus: 'available_now' | 'available_in_weeks' | 'not_available';
};

export function normalizeUrlField(value: string): string | null {
  const s = value.trim();
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) return s;
  return `https://${s}`;
}

export function buildProfilePatchPayload(data: Pick<EngineerProfileForm, 'fullName' | 'headline' | 'bio' | 'location' | 'githubUrl' | 'linkedinUrl' | 'portfolioUrl' | 'hourlyRate' | 'availabilityStatus'>) {
  const fullName = data.fullName.trim();
  return {
    ...(fullName.length >= 2 ? { fullName } : {}),
    headline: data.headline.trim() || null,
    bio: data.bio.trim() || null,
    location: data.location.trim() || null,
    githubUrl: normalizeUrlField(data.githubUrl),
    linkedinUrl: normalizeUrlField(data.linkedinUrl),
    portfolioUrl: normalizeUrlField(data.portfolioUrl),
    hourlyRate: data.hourlyRate,
    availabilityStatus: data.availabilityStatus,
    ...(data.availabilityStatus === 'available_in_weeks'
      ? { availableInWeeks: 2 }
      : {}),
  };
}

export function mapEngineerProfileToForm(profile: EngineerProfileData): EngineerProfileForm {
  return {
    fullName: profile.fullName || '',
    headline: profile.headline || '',
    bio: profile.bio || '',
    location: profile.location || '',
    githubUrl: profile.githubUrl || '',
    linkedinUrl: profile.linkedinUrl || '',
    portfolioUrl: profile.portfolioUrl || '',
    hourlyRate: Number(profile.hourlyRate) || 0,
    availabilityStatus:
      (profile.availabilityStatus as EngineerProfileForm['availabilityStatus']) ||
      'available_now',
  };
}

export function validateProfileFormName(fullName: string): string | null {
  const trimmed = fullName.trim();
  if (trimmed.length > 0 && trimmed.length < 2) {
    return 'Full name must be at least 2 characters';
  }
  return null;
}
