import { ImageResponse } from 'next/og';
import { initialsFromName } from '@/lib/avatar-tone';

export const runtime = 'edge';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001';

type OgTier = 'Elite' | 'Professional' | 'Verified' | 'Conditional';

const TIER_TW: Record<
  OgTier,
  { glow: string; border: string; badge: string; score: string }
> = {
  Elite: {
    glow: 'bg-[radial-gradient(circle,rgba(245,158,11,0.08)_0%,transparent_70%)]',
    border: 'border-accent-amber',
    badge: 'bg-accent-amber/20 border-accent-amber/40 text-accent-amber',
    score: 'text-accent-amber',
  },
  Professional: {
    glow: 'bg-[radial-gradient(circle,rgba(0,212,255,0.08)_0%,transparent_70%)]',
    border: 'border-accent-cyan',
    badge: 'bg-accent-cyan/20 border-accent-cyan/40 text-accent-cyan',
    score: 'text-accent-cyan',
  },
  Verified: {
    glow: 'bg-[radial-gradient(circle,rgba(123,94,167,0.08)_0%,transparent_70%)]',
    border: 'border-accent-violet',
    badge: 'bg-accent-violet/20 border-accent-violet/40 text-accent-violet',
    score: 'text-accent-violet',
  },
  Conditional: {
    glow: 'bg-[radial-gradient(circle,rgba(74,85,104,0.12)_0%,transparent_70%)]',
    border: 'border-text-muted',
    badge: 'bg-text-muted/20 border-text-muted/40 text-text-muted',
    score: 'text-text-muted',
  },
};

function mapTier(tier: string): OgTier {
  const t = tier?.toLowerCase() ?? '';
  if (t.includes('elite')) return 'Elite';
  if (t.includes('professional') || t.includes('pro')) return 'Professional';
  if (t.includes('verified')) return 'Verified';
  return 'Conditional';
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  let engineer = {
    id: params.id,
    name: 'AI Engineer',
    headline: 'NeuronHire Engineer Profile',
    tier: 'Verified' as OgTier,
    neuronScore: 0,
    reviewCount: 0,
    projectCount: 0,
    hourlyRateINR: 0,
    avatarInitials: 'AI',
  };

  try {
    const res = await fetch(`${API_BASE}/api/engineer/profiles/${params.id}`, {
      next: { revalidate: 300 },
    });
    if (res.ok) {
      const json = await res.json();
      const data = json?.data ?? json;
      const name = String(data.fullName ?? engineer.name);
      engineer = {
        id: params.id,
        name,
        headline: String(data.headline ?? engineer.headline),
        tier: mapTier(String(data.neuronTier ?? '')),
        neuronScore: Number(data.neuronScore ?? 0),
        reviewCount: Number(data.reviewCount ?? 0),
        projectCount: Array.isArray(data.projects) ? data.projects.length : 0,
        hourlyRateINR: Number(data.hourlyRate ?? 0),
        avatarInitials: initialsFromName(name),
      };
    }
  } catch {
    // Use fallback engineer object for OG image
  }

  const tierTw = TIER_TW[engineer.tier];

  return new ImageResponse(
    (
      <div tw="flex flex-col relative overflow-hidden bg-bg-base w-full h-full font-sans">
        <div
          tw={`absolute rounded-full w-[500px] h-[500px] -top-[100px] -left-[100px] ${tierTw.glow}`}
        />
        <div tw="flex flex-col flex-1 relative z-10 py-[60px] px-[80px]">
          <div tw="flex items-center gap-[10px] mb-12">
            <div tw="flex items-center justify-center w-8 h-8 rounded-lg bg-accent-cyan">
              <div tw="w-[14px] h-[14px] rounded-sm bg-bg-base" />
            </div>
            <span tw="text-text-primary text-xl font-bold">NeuronHire</span>
          </div>

          <div tw="flex items-center gap-12 flex-1">
            <div
              tw={`flex items-center justify-center w-[120px] h-[120px] rounded-full bg-accent-cyan shrink-0 text-[40px] font-bold text-bg-base border-4 ${tierTw.border}`}
            >
              {engineer.avatarInitials}
            </div>

            <div tw="flex flex-col gap-3 flex-1">
              <div tw="flex items-center gap-4">
                <span tw="text-text-primary text-[42px] font-extrabold">{engineer.name}</span>
                <span
                  tw={`px-3 py-1 rounded-full text-sm font-semibold border ${tierTw.badge}`}
                >
                  {engineer.tier}
                </span>
              </div>
              <span tw="text-text-secondary text-xl">{engineer.headline}</span>

              <div tw="flex gap-8 mt-2">
                <div tw="flex flex-col gap-0.5">
                  <span tw={`text-[28px] font-bold font-mono ${tierTw.score}`}>
                    {engineer.neuronScore}
                  </span>
                  <span tw="text-text-muted text-xs">NeuronScore</span>
                </div>
                <div tw="flex flex-col gap-0.5">
                  <span tw="text-text-primary text-[28px] font-bold font-mono">
                    {engineer.reviewCount}
                  </span>
                  <span tw="text-text-muted text-xs">Reviews</span>
                </div>
                <div tw="flex flex-col gap-0.5">
                  <span tw="text-text-primary text-[28px] font-bold font-mono">
                    {engineer.projectCount}
                  </span>
                  <span tw="text-text-muted text-xs">Projects</span>
                </div>
                <div tw="flex flex-col gap-0.5">
                  <span tw="text-accent-cyan text-[28px] font-bold font-mono">
                    ₹{engineer.hourlyRateINR.toLocaleString('en-IN')}/hr
                  </span>
                  <span tw="text-text-muted text-xs">Hourly Rate</span>
                </div>
              </div>
            </div>
          </div>

          <div tw="flex items-center justify-between pt-6 border-t border-white/10">
            <span tw="text-text-muted text-sm">neuronhire.com/engineer/{params.id}</span>
            <span tw="text-text-muted text-sm">India&apos;s AI Talent Marketplace</span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
