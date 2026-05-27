import { getTierForScore } from '@/lib/bounty-data';

export type TierTone = 'gray' | 'violet' | 'cyan' | 'amber';

const TIER_TO_TONE: Record<string, TierTone> = {
  Conditional: 'gray',
  Verified: 'violet',
  Professional: 'cyan',
  Elite: 'amber',
};

export function tierToneForScore(score: number): TierTone {
  return TIER_TO_TONE[getTierForScore(score).tier] ?? 'gray';
}

export function tierToneForTierName(tier: string): TierTone {
  return TIER_TO_TONE[tier] ?? 'gray';
}
