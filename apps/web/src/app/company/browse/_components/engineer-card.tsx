'use client';

import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Badge, TierBadge } from '@/components/ui/badge';
import { NeuronScoreRing } from '@/components/ui/neuron-score-ring';
import type { SearchEngineer } from '@/lib/hiring-data';

interface EngineerCardProps {
  engineer: SearchEngineer;
  onInvite?: (id: string) => void;
  onMessage?: (id: string) => void;
  onSave?: (id: string) => void;
  onTrial?: (id: string) => void;
  'data-testid'?: string;
}

const AVAILABILITY_CONFIG = {
  available_now:    { color: '#10B981', label: 'Available Now',    pulse: true },
  within_2_weeks:   { color: '#F59E0B', label: 'In 2 weeks',       pulse: false },
  any:              { color: '#4A5568', label: 'Not specified',     pulse: false },
};

export function EngineerCard({
  engineer: eng,
  onInvite,
  onMessage,
  onSave,
  onTrial,
  'data-testid': testId,
}: EngineerCardProps) {
  const avail = AVAILABILITY_CONFIG[eng.availability];

  return (
    <article
      className="group relative bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:border-[rgba(0,212,255,0.2)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
      data-testid={testId ?? `engineer-card-${eng.id}`}
    >
      <div className="p-5">
        {/* Top row: availability + score */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5">
            <div
              className={cn('w-2 h-2 rounded-full', avail.pulse && 'animate-pulse')}
              style={{ background: avail.color }}
              aria-hidden="true"
            />
            <span className="text-xs text-text-muted">{avail.label}</span>
          </div>
          <NeuronScoreRing score={eng.neuronScore} size={44} strokeWidth={3} animate={false} />
        </div>

        {/* Avatar + name + badges */}
        <div className="flex items-start gap-3 mb-3">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center font-display font-bold text-bg-base text-sm shrink-0"
            style={{ background: eng.avatarColor }}
            aria-hidden="true"
          >
            {eng.initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Link href={`/engineer/${eng.id}`}>
                <span className="font-display font-semibold text-text-primary text-sm hover:text-accent-cyan transition-colors">
                  {eng.name}
                </span>
              </Link>
              {eng.emailVerified && (
                <svg width="13" height="13" viewBox="0 0 20 20" fill="#00D4FF" aria-label="Email verified">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
              )}
              {eng.kycVerified && (
                <svg width="13" height="13" viewBox="0 0 20 20" fill="#F59E0B" aria-label="KYC verified">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
              )}
            </div>
            <p className="text-xs text-text-muted mt-0.5 line-clamp-1">{eng.headline}</p>
          </div>
        </div>

        {/* Skills */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {eng.skills.slice(0, 5).map((s) => (
            <Badge key={s} variant="gray" className="text-[10px] px-2 py-0.5">{s}</Badge>
          ))}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 text-xs text-text-muted mb-3">
          <span className="flex items-center gap-0.5">
            <span className="text-accent-amber">★</span>
            <span className="font-mono">{eng.rating}</span>
          </span>
          <span className="w-px h-3 bg-[rgba(255,255,255,0.08)]" aria-hidden="true" />
          <span>{eng.projectCount} projects</span>
          <span className="w-px h-3 bg-[rgba(255,255,255,0.08)]" aria-hidden="true" />
          <span>{eng.reviewCount} reviews</span>
        </div>

        {/* Rate + match */}
        <div className="flex items-center justify-between">
          <div>
            <span className="font-mono font-semibold text-accent-cyan text-base">
              ₹{eng.hourlyRateINR.toLocaleString('en-IN')}/hr
            </span>
            {onTrial && (
              <button
                onClick={() => onTrial(eng.id)}
                className="block text-[10px] text-text-muted hover:text-accent-cyan transition-colors mt-0.5"
              >
                or start 2hr trial →
              </button>
            )}
          </div>
          {eng.matchScore !== undefined && (
            <span
              className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[rgba(0,212,255,0.1)] text-accent-cyan border border-[rgba(0,212,255,0.2)]"
              data-testid={`match-score-${eng.id}`}
            >
              {eng.matchScore}% match
            </span>
          )}
        </div>
      </div>

      {/* Hover actions — slide up from bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 bg-bg-elevated border-t border-[rgba(255,255,255,0.06)] px-4 py-3 flex gap-2 translate-y-full group-hover:translate-y-0 transition-transform duration-200"
        aria-label="Quick actions"
      >
        <button
          onClick={() => onInvite?.(eng.id)}
          className="flex-1 text-xs py-1.5 rounded-lg bg-accent-cyan text-bg-base font-semibold hover:brightness-110 transition-all"
          aria-label={`Invite ${eng.name} to apply`}
        >
          Invite
        </button>
        <button
          onClick={() => onMessage?.(eng.id)}
          className="flex-1 text-xs py-1.5 rounded-lg border border-[rgba(0,212,255,0.3)] text-accent-cyan hover:bg-[rgba(0,212,255,0.05)] transition-all"
          aria-label={`Message ${eng.name}`}
        >
          Message
        </button>
        <button
          onClick={() => onSave?.(eng.id)}
          className="px-3 text-xs py-1.5 rounded-lg border border-[rgba(255,255,255,0.08)] text-text-muted hover:text-text-secondary transition-all"
          aria-label={`Save ${eng.name}`}
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 2h10a1 1 0 011 1v11l-6-3-6 3V3a1 1 0 011-1z"/>
          </svg>
        </button>
      </div>
    </article>
  );
}
