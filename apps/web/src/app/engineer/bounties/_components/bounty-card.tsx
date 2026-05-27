'use client';

import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { avatarToneClass } from '@/lib/avatar-tone';
import { getDeadlineLabel, formatReward, type BountyCard as BountyCardType } from '@/lib/bounty-data';

const TYPE_COLORS = {
  Bounty:  { bg: 'bg-[rgba(0,212,255,0.1)]',   text: 'text-accent-cyan',   border: 'rgba(0,212,255,0.5)' },
  Direct:  { bg: 'bg-[rgba(123,94,167,0.15)]',  text: 'text-accent-violet', border: 'rgba(123,94,167,0.5)' },
  Contest: { bg: 'bg-[rgba(245,158,11,0.1)]',   text: 'text-accent-amber',  border: 'rgba(245,158,11,0.5)' },
};

const DIFF_VARIANT = {
  Beginner:     'green',
  Intermediate: 'cyan',
  Advanced:     'amber',
  Hard:         'amber',
  Expert:       'violet',
} as const;

interface BountyCardProps {
  bounty: BountyCardType;
  engineerScore?: number;
  'data-testid'?: string;
}

export function BountyCard({ bounty, engineerScore = 920, 'data-testid': testId }: BountyCardProps) {
  const [expanded, setExpanded] = React.useState(false);
  const isLocked = engineerScore < bounty.minNeuronScore;
  const { label: deadlineLabel, urgent } = getDeadlineLabel(bounty.deadline);
  const typeStyle = TYPE_COLORS[bounty.type];
  const visibleSkills = bounty.skills.slice(0, 4);
  const extraSkills = bounty.skills.length - 4;

  return (
    <div
      className={cn(
        'group relative bg-bg-surface rounded-xl border border-[rgba(255,255,255,0.06)]',
        'transition-all duration-200',
        'hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)]',
        'overflow-hidden'
      )}
      data-testid={testId ?? `bounty-card-${bounty.id}`}
    >
      {/* Animated left border — grows from 0 to full height on hover */}
      <div
        className="absolute left-0 top-0 w-0.5 bg-accent-cyan h-0 group-hover:h-full transition-all duration-200 ease-out"
        aria-hidden="true"
      />

      {/* Locked overlay */}
      {isLocked && (
        <div className="absolute inset-0 z-10 bg-bg-base/80 backdrop-blur-[2px] flex flex-col items-center justify-center gap-3 rounded-xl">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0110 0v4"/>
          </svg>
          <p className="text-sm text-text-muted text-center px-4">
            Score {bounty.minNeuronScore}+ required
          </p>
          <button className="text-xs px-3 py-1.5 rounded-lg bg-[rgba(245,158,11,0.1)] text-accent-amber border border-[rgba(245,158,11,0.2)] hover:bg-[rgba(245,158,11,0.2)] transition-colors">
            Take Mini-Gate Test
          </button>
        </div>
      )}

      <div className="p-5">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center font-display font-bold text-bg-base text-[10px] shrink-0',
                avatarToneClass(bounty.company),
              )}
              aria-hidden="true"
            >
              {bounty.companyInitials}
            </div>
            <span className="text-xs text-text-secondary">{bounty.company}</span>
            {bounty.companyVerified && (
              <svg width="12" height="12" viewBox="0 0 20 20" fill="#00D4FF" aria-label="Verified company">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
            )}
          </div>
          <span className={cn('text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full', typeStyle.bg, typeStyle.text)}>
            {bounty.type}
          </span>
        </div>

        {/* Title */}
        <Link href={`/engineer/bounties/${bounty.id}`}>
          <h3 className="font-display font-semibold text-text-primary text-[17px] leading-snug mb-2 hover:text-accent-cyan transition-colors line-clamp-2">
            {bounty.title}
          </h3>
        </Link>

        {/* Description */}
        <p className={cn('text-text-muted text-xs leading-relaxed mb-3', !expanded && 'line-clamp-2')}>
          {bounty.description}
        </p>
        {bounty.description.length > 120 && (
          <button
            onClick={() => setExpanded((e) => !e)}
            className="text-[10px] text-accent-cyan hover:underline mb-3"
          >
            {expanded ? 'Show less' : 'Read more'}
          </button>
        )}

        {/* Skills */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {visibleSkills.map((s) => (
            <Badge key={s} variant="gray" className="text-[10px] px-2 py-0.5">{s}</Badge>
          ))}
          {extraSkills > 0 && (
            <Badge variant="gray" className="text-[10px] px-2 py-0.5">+{extraSkills} more</Badge>
          )}
        </div>

        {/* Bottom bar */}
        <div className="flex items-center justify-between pt-3 border-t border-[rgba(255,255,255,0.06)]">
          {/* Reward */}
          <span
            className="font-mono font-bold text-accent-amber text-lg leading-none"
            data-testid={`reward-${bounty.id}`}
          >
            {formatReward(bounty.reward, bounty.currency)}
          </span>

          {/* Difficulty */}
          <Badge variant={DIFF_VARIANT[bounty.difficulty]}>{bounty.difficulty}</Badge>

          {/* Deadline */}
          <span
            className={cn(
              'text-xs font-mono',
              urgent ? 'text-accent-red' : 'text-text-muted'
            )}
            data-testid={`deadline-${bounty.id}`}
          >
            {deadlineLabel}
          </span>
        </div>
      </div>
    </div>
  );
}
