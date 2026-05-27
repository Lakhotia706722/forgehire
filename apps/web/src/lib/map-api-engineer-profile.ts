import type { EngineerProfile, TierName } from './mock-data';
import { avatarToneClass, initialsFromName } from './avatar-tone';

function mapTier(tier: string): TierName {
  const t = tier?.toLowerCase() ?? '';
  if (t.includes('elite')) return 'Elite';
  if (t.includes('professional') || t.includes('pro')) return 'Professional';
  if (t.includes('verified')) return 'Verified';
  return 'Conditional';
}

const GRADIENTS = [
  'from-[#00D4FF]/20 to-[#7B5EA7]/20',
  'from-[#F59E0B]/20 to-[#EF4444]/20',
  'from-[#10B981]/20 to-[#00D4FF]/20',
];

/** Maps API public engineer profile → UI EngineerProfile */
export function mapApiEngineerToPublicProfile(
  raw: Record<string, unknown>,
): EngineerProfile {
  const name = String(raw.fullName ?? 'Engineer');
  const skills = Array.isArray(raw.skills)
    ? (raw.skills as { skillName: string; proficiencyLevel?: string }[]).map((s) => ({
        name: s.skillName,
        proficiency: 2 as const,
        projectCount: 0,
        verified: false,
      }))
    : [];

  const projects = Array.isArray(raw.projects)
    ? (raw.projects as Record<string, unknown>[]).map((p, i) => ({
        id: String(p.id ?? i),
        title: String(p.title ?? ''),
        description: String(p.description ?? ''),
        type: 'Agent' as const,
        techStack: Array.isArray(p.techStack) ? (p.techStack as string[]) : [],
        demoUrl: p.demoUrl as string | undefined,
        metrics: [],
        thumbnailGradient: GRADIENTS[i % GRADIENTS.length],
      }))
    : [];

  const hourly = Number(raw.hourlyRate ?? 0);

  return {
    id: String(raw.id),
    name,
    headline: String(raw.headline ?? ''),
    bio: String(raw.bio ?? ''),
    location: String(raw.location ?? 'Remote'),
    avatarInitials: initialsFromName(name),
    avatarColor: '#00D4FF',
    neuronScore: Number(raw.neuronScore ?? 0),
    tier: mapTier(String(raw.neuronTier ?? '')),
    hourlyRateINR: hourly,
    hourlyRateUSD: Math.round(hourly / 83),
    availability: 'available',
    availabilityLabel: String(raw.availabilityStatus ?? 'Available').replace(/_/g, ' '),
    rating: 4.8,
    reviewCount: 0,
    projectCount: projects.length,
    responseRate: 95,
    avgResponseTime: '< 2h',
    emailVerified: true,
    kycVerified: Boolean(raw.kycVerified),
    skills,
    projects,
    experiences: [],
    techStack: [],
    reviews: [],
    products: [],
    activities: [],
  };
}
