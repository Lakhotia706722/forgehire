import type { SearchEngineer, AvailabilityStatus } from './hiring-data';
import { initialsFromName } from './avatar-tone';

const AVATAR_COLORS = ['#00D4FF', '#7B5EA7', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6'];

function colorFromName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function mapTier(tier: string): SearchEngineer['tier'] {
  const t = tier?.toLowerCase() ?? '';
  if (t.includes('elite')) return 'Elite';
  if (t.includes('professional') || t.includes('pro')) return 'Professional';
  if (t.includes('verified')) return 'Verified';
  return 'Conditional';
}

function mapAvailability(status: string | null | undefined): AvailabilityStatus {
  if (status === 'available_now') return 'available_now';
  if (status === 'within_2_weeks') return 'within_2_weeks';
  return 'any';
}

/** Maps API search result → SearchEngineer card data */
export function mapApiSearchEngineer(raw: Record<string, unknown>): SearchEngineer {
  const name = String(raw.fullName ?? 'Engineer');
  const skills = Array.isArray(raw.skills)
    ? (raw.skills as string[])
    : [];

  return {
    id: String(raw.id),
    name,
    initials: initialsFromName(name),
    avatarColor: colorFromName(name),
    headline: String(raw.headline ?? raw.bio ?? ''),
    neuronScore: Number(raw.neuronScore ?? 0),
    tier: mapTier(String(raw.neuronTier ?? '')),
    skills,
    rating: Number(raw.rating ?? 4.5),
    projectCount: Number(raw.projectCount ?? 0),
    reviewCount: Number(raw.reviewCount ?? 0),
    hourlyRateINR: Number(raw.hourlyRate ?? 0),
    availability: mapAvailability(raw.availabilityStatus as string),
    workMode: 'remote',
    emailVerified: true,
    kycVerified: Boolean(raw.kycVerified),
    matchScore: raw.matchScore != null ? Number(raw.matchScore) : undefined,
  };
}
