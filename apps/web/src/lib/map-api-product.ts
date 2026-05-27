import type { AIModel, PricingModel, ProductCategory, ProductListing } from './marketplace-data';

const CATEGORY_MAP: Record<string, ProductCategory> = {
  ai_agents: 'AI Agents',
  fine_tuned_models: 'Fine-Tuned Models',
  saas_tools: 'SaaS Tools',
  automation_workflows: 'Automation',
  datasets_prompts: 'Datasets & Prompts',
  apis_microservices: 'APIs',
};

const GRADIENTS = [
  'from-[rgba(0,212,255,0.15)] to-[rgba(123,94,167,0.1)]',
  'from-[rgba(123,94,167,0.15)] to-[rgba(245,158,11,0.08)]',
  'from-[rgba(16,185,129,0.1)] to-[rgba(0,212,255,0.08)]',
];

function initials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'NH';
}

function colorFromName(name: string): string {
  const COLORS = ['#00D4FF', '#7B5EA7', '#F59E0B', '#10B981', '#EF4444'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((v) => String(v)).filter(Boolean);
  }
  if (typeof value === 'string' && value.trim()) {
    return [value.trim()];
  }
  return [];
}

function parseFeatures(
  value: unknown,
): { icon: string; text: string }[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const f = item as Record<string, unknown>;
      const title = String(f.title ?? f.name ?? '');
      const desc = String(f.description ?? f.text ?? '');
      const text = [title, desc].filter(Boolean).join(' — ');
      if (!text) return null;
      return { icon: '✓', text };
    })
    .filter((x): x is { icon: string; text: string } => x !== null);
}

function parsePerformanceMetrics(value: unknown): {
  accuracy?: number;
  avgResponseMs?: number;
  uptime?: number;
} {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const m = value as Record<string, unknown>;
  return {
    accuracy: m.accuracy != null ? Number(m.accuracy) : undefined,
    avgResponseMs:
      m.avgResponseMs != null
        ? Number(m.avgResponseMs)
        : m.avgResponseTime != null
          ? Number(m.avgResponseTime)
          : undefined,
    uptime: m.uptime != null ? Number(m.uptime) : undefined,
  };
}

/** Maps API product feed item → ProductListing for marketplace UI. */
export function mapApiProductToListing(
  raw: Record<string, unknown>,
  index = 0,
): ProductListing {
  const engineerProfile = raw.engineerProfile as Record<string, unknown> | undefined;
  const engineerName = String(engineerProfile?.fullName ?? 'Engineer');
  const name = String(raw.name ?? 'Product');
  const categoryKey = String(raw.category ?? 'saas_tools');
  const performance = parsePerformanceMetrics(raw.performanceMetrics);
  const deliveryType = String(raw.deliveryType ?? '');
  const featuresJson = raw.features;
  const useCasesFromMetrics = asStringArray(
    (raw.performanceMetrics as Record<string, unknown> | undefined)?.useCases,
  );

  return {
    id: String(raw.id ?? ''),
    name,
    tagline: String(raw.tagline ?? ''),
    category: CATEGORY_MAP[categoryKey] ?? 'SaaS Tools',
    tags: Array.isArray(raw.tags) ? (raw.tags as string[]) : [],
    thumbnailGradient: GRADIENTS[index % GRADIENTS.length],
    thumbnailUrl: raw.thumbnailUrl ? String(raw.thumbnailUrl) : undefined,
    screenshots: Array.isArray(raw.screenshots) ? (raw.screenshots as string[]) : [],
    videoUrl: raw.videoUrl ? String(raw.videoUrl) : undefined,
    demoUrl: raw.demoUrl ? String(raw.demoUrl) : undefined,
    hasTryBeforeBuy: Boolean(raw.demoUrl),
    engineerId: String(raw.engineerProfileId ?? engineerProfile?.id ?? ''),
    engineerName,
    engineerInitials: initials(engineerName),
    engineerColor: colorFromName(engineerName),
    engineerScore: Number(engineerProfile?.neuronScore ?? 0),
    pricingModel: (String(raw.pricingModel ?? 'one_time') as PricingModel),
    priceINR: Number(raw.priceINR ?? 0),
    priceUSD: Number(raw.priceUSD ?? 0),
    rating: Number(raw.rating ?? 0),
    reviewCount: Number(
      raw.reviewCount ??
        (raw._count as { reviews?: number } | undefined)?.reviews ??
        0,
    ),
    techStack: asStringArray(raw.techStack),
    aiModel: (String(raw.aiModelUsed ?? 'Custom') as AIModel),
    architectureType: String(raw.architectureType ?? ''),
    hostingRequirements: asStringArray(raw.hostingRequirements),
    apiDependencies: asStringArray(raw.apiDependencies),
    features: parseFeatures(featuresJson),
    useCases: useCasesFromMetrics,
    whoItsFor: String(raw.whoItsFor ?? raw.tagline ?? ''),
    deliverables: deliveryType ? [deliveryType] : asStringArray(raw.deliverables),
    supportType: String(raw.supportType ?? ''),
    supportDuration: String(raw.supportDuration ?? ''),
    responseTimeSLA: String(raw.responseTimeSLA ?? ''),
    customizationAvailable: Boolean(raw.customizationAvailable),
    customizationPrice:
      raw.customizationPrice != null ? Number(raw.customizationPrice) : undefined,
    accuracy: performance.accuracy,
    avgResponseMs: performance.avgResponseMs,
    uptime: performance.uptime,
    purchaseCount: Number(raw.purchaseCount ?? 0),
    viewCount: Number(raw.viewCount ?? 0),
    demoClickCount: 0,
    description: String(raw.description ?? ''),
    problemSolved: String(raw.problemSolved ?? ''),
  };
}
