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

function relativeTime(value: unknown): string {
  if (!value) return 'recently';
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return 'recently';
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
}

function proficiencyToLevel(value: unknown): 1 | 2 | 3 {
  const v = String(value ?? '').toLowerCase();
  if (v === 'expert' || v === 'advanced') return 3;
  if (v === 'intermediate') return 2;
  return 1;
}

function mapTechCategories(skills: EngineerProfile['skills']): EngineerProfile['techStack'] {
  if (!skills.length) return [];
  return [
    {
      category: 'Skills',
      skills: skills.map((s) => ({
        name: s.name,
        proficiency: s.proficiency,
        projectCount: s.projectCount,
        verified: s.verified,
      })),
    },
  ];
}

/** Maps API public engineer profile → UI EngineerProfile */
export function mapApiEngineerToPublicProfile(
  raw: Record<string, unknown>,
): EngineerProfile {
  const name = String(raw.fullName ?? 'Engineer');
  const skills = Array.isArray(raw.skills)
    ? (raw.skills as { skillName: string; proficiencyLevel?: string; projectCount?: number; verified?: boolean }[]).map((s) => ({
        name: s.skillName,
        proficiency: proficiencyToLevel(s.proficiencyLevel),
        projectCount: Number(s.projectCount ?? 0),
        verified: Boolean(s.verified),
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

  const experiences = Array.isArray(raw.experiences)
    ? (raw.experiences as Record<string, unknown>[]).map((e, i) => ({
        id: String(e.id ?? i),
        company: String(e.company ?? ''),
        role: String(e.title ?? ''),
        startDate: e.startDate ? new Date(String(e.startDate)).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '',
        endDate: e.current ? null : e.endDate ? new Date(String(e.endDate)).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : null,
        current: Boolean(e.current),
        description: String(e.description ?? ''),
        impact: Array.isArray(e.achievements) ? (e.achievements as string[]) : [],
        verified: false,
        accentColor: ['#00D4FF', '#7B5EA7', '#F59E0B'][i % 3],
      }))
    : [];

  const products = Array.isArray(raw.products)
    ? (raw.products as Record<string, unknown>[]).map((p, i) => ({
        id: String(p.id ?? i),
        title: String(p.name ?? ''),
        category: String(p.category ?? 'Product'),
        price: `₹${Number(p.priceINR ?? 0).toLocaleString('en-IN')}`,
        rating: Number(p.rating ?? 0),
        reviewCount: Number(p.reviewCount ?? 0),
        gradient: GRADIENTS[i % GRADIENTS.length],
      }))
    : [];

  const activities = Array.isArray(raw.activities)
    ? (raw.activities as Record<string, unknown>[]).map((a, i) => ({
        id: String(a.id ?? i),
        text: String(a.content ?? ''),
        timestamp: relativeTime(a.createdAt),
        likes: 0,
      }))
    : [];

  const reviews = Array.isArray(raw.taskSubmissions)
    ? (raw.taskSubmissions as Record<string, unknown>[]).map((r, i) => {
        const score = Number(r.score ?? 0);
        const stars = Math.max(1, Math.min(5, Math.round(score / 20)));
        const task = (r.task ?? {}) as Record<string, unknown>;
        const company = (task.companyProfile ?? {}) as Record<string, unknown>;
        const reviewerCompany = String(company.companyName ?? 'Client');
        return {
          id: String(r.id ?? i),
          reviewerName: reviewerCompany,
          reviewerCompany,
          reviewerInitials: initialsFromName(reviewerCompany),
          rating: stars,
          text: String(r.feedback ?? 'Delivered successfully.'),
          projectRef: String(task.title ?? 'Project delivery'),
          date: relativeTime(r.reviewedAt),
          verified: true,
        };
      })
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
    rating: reviews.length
      ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1))
      : 0,
    reviewCount: reviews.length,
    projectCount: projects.length,
    responseRate: 95,
    avgResponseTime: '< 2h',
    emailVerified: true,
    kycVerified: Boolean(raw.kycVerified),
    skills,
    projects,
    experiences,
    techStack: mapTechCategories(skills),
    reviews,
    products,
    activities,
  };
}
