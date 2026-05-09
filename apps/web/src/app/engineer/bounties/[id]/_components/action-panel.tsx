'use client';

import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { formatReward, formatCountdown } from '@/lib/bounty-data';
import type { BountyDetail } from '@/lib/bounty-data';

interface ActionPanelProps {
  bounty: BountyDetail;
  engineerScore: number;
  onParticipate: () => void;
  participated: boolean;
}

export function ActionPanel({ bounty, engineerScore, onParticipate, participated }: ActionPanelProps) {
  const [countdown, setCountdown] = React.useState(formatCountdown(bounty.deadline));
  const isEligible = engineerScore >= bounty.minNeuronScore;

  React.useEffect(() => {
    const t = setInterval(() => setCountdown(formatCountdown(bounty.deadline)), 1000);
    return () => clearInterval(t);
  }, [bounty.deadline]);

  return (
    <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 space-y-5">
      {/* Reward */}
      <div className="text-center pb-4 border-b border-[rgba(255,255,255,0.06)]">
        <p className="text-xs text-text-muted mb-1">Total Reward</p>
        <p className="font-display font-bold text-accent-amber text-4xl leading-none">
          {formatReward(bounty.reward, bounty.currency)}
        </p>
      </div>

      {/* Countdown */}
      <div className="text-center">
        <p className="text-xs text-text-muted mb-1.5">Deadline</p>
        <p
          className="font-mono font-semibold text-text-primary text-lg tabular-nums"
          data-testid="detail-countdown"
          aria-live="polite"
          aria-label={`Time remaining: ${countdown}`}
        >
          {countdown}
        </p>
      </div>

      {/* Participants */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-text-muted">Participating</span>
        <span className="font-mono text-text-primary">{bounty.participantCount} engineers</span>
      </div>

      {/* Eligibility */}
      <div className={cn(
        'flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm',
        isEligible
          ? 'bg-[rgba(16,185,129,0.08)] border border-[rgba(16,185,129,0.2)]'
          : 'bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.2)]'
      )}>
        <svg
          width="14" height="14" viewBox="0 0 20 20"
          fill={isEligible ? '#10B981' : '#F59E0B'}
          aria-hidden="true"
        >
          {isEligible ? (
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
          ) : (
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
          )}
        </svg>
        <span className={isEligible ? 'text-accent-green' : 'text-accent-amber'}>
          {isEligible ? "You're eligible" : `Requires Mini-Gate Test (${bounty.minNeuronScore}+)`}
        </span>
      </div>

      {/* NDA notice */}
      {bounty.ndaRequired && (
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-[rgba(123,94,167,0.08)] border border-[rgba(123,94,167,0.2)] text-xs text-text-secondary">
          <svg width="14" height="14" viewBox="0 0 20 20" fill="#7B5EA7" className="shrink-0 mt-0.5" aria-hidden="true">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
          </svg>
          You must sign an NDA to see full details and participate.
        </div>
      )}

      {/* Participate CTA */}
      {participated ? (
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[rgba(16,185,129,0.08)] border border-[rgba(16,185,129,0.2)]">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M2 8l4 4 8-8"/>
            </svg>
            <span className="text-sm text-accent-green font-medium">Participating</span>
          </div>
          <Link href={`/engineer/bounties/${bounty.id}/submit`}>
            <Button variant="secondary" size="md" className="w-full">
              Submit Solution
            </Button>
          </Link>
        </div>
      ) : (
        <Button
          size="lg"
          className="w-full"
          onClick={onParticipate}
          data-testid="participate-btn"
        >
          {bounty.ndaRequired ? 'Sign NDA & Participate' : 'Participate'}
        </Button>
      )}

      {/* Share + Save */}
      <div className="flex gap-2">
        <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-[rgba(255,255,255,0.08)] text-xs text-text-muted hover:text-text-secondary hover:border-[rgba(255,255,255,0.15)] transition-all">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="13" cy="3" r="1.5"/><circle cx="13" cy="13" r="1.5"/><circle cx="3" cy="8" r="1.5"/>
            <path d="M4.5 7.5l7-3.5M4.5 8.5l7 3.5"/>
          </svg>
          Share
        </button>
        <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-[rgba(255,255,255,0.08)] text-xs text-text-muted hover:text-text-secondary hover:border-[rgba(255,255,255,0.15)] transition-all">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 2h10a1 1 0 011 1v11l-6-3-6 3V3a1 1 0 011-1z"/>
          </svg>
          Save
        </button>
      </div>
    </div>
  );
}
