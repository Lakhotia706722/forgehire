'use client';

import * as React from 'react';
import { NeuronScoreRing } from '@/components/ui/neuron-score-ring';
import { Badge, TierBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { EngineerProfile } from '@/lib/mock-data';

const TIER_RING_COLOR: Record<string, string> = {
  Elite:        'ring-[#F59E0B]',
  Professional: 'ring-[#00D4FF]',
  Verified:     'ring-[#7B5EA7]',
  Conditional:  'ring-[#4A5568]',
};

interface ProfileHeroProps {
  engineer: EngineerProfile;
}

export function ProfileHero({ engineer: eng }: ProfileHeroProps) {
  const [currency, setCurrency] = React.useState<'INR' | 'USD'>('INR');
  const [rateVisible, setRateVisible] = React.useState(true);

  function toggleCurrency() {
    setRateVisible(false);
    setTimeout(() => {
      setCurrency((c) => (c === 'INR' ? 'USD' : 'INR'));
      setRateVisible(true);
    }, 150);
  }

  const displayRate =
    currency === 'INR'
      ? `₹${eng.hourlyRateINR.toLocaleString('en-IN')}/hr`
      : `$${eng.hourlyRateUSD}/hr`;

  return (
    <div className="relative">
      {/* Banner */}
      <div
        className="h-40 md:h-52 w-full geo-pattern"
        style={{
          background:
            'linear-gradient(135deg, rgba(0,212,255,0.06) 0%, rgba(123,94,167,0.08) 50%, rgba(8,11,20,1) 100%)',
        }}
        aria-hidden="true"
      />

      {/* Profile card */}
      <div className="max-w-5xl mx-auto px-6">
        <div className="relative -mt-16 md:-mt-20 pb-8">
          {/* Avatar row */}
          <div className="flex flex-col sm:flex-row sm:items-end gap-5 mb-6">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div
                className={cn(
                  'w-24 h-24 md:w-28 md:h-28 rounded-full flex items-center justify-center',
                  'font-display font-bold text-bg-base text-2xl',
                  'ring-4 ring-offset-4 ring-offset-bg-base',
                  TIER_RING_COLOR[eng.tier]
                )}
                style={{ background: eng.avatarColor }}
                aria-label={`${eng.name}'s avatar`}
              >
                {eng.avatarInitials}
              </div>
              {/* Availability dot */}
              {eng.availability === 'available' && (
                <span
                  className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-accent-green border-2 border-bg-base availability-pulse"
                  aria-label="Available now"
                />
              )}
            </div>

            {/* Name + badges */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="font-display font-bold text-2xl md:text-3xl text-text-primary">
                  {eng.name}
                </h1>
                {eng.emailVerified && (
                  <span title="Email verified" aria-label="Email verified">
                    <svg width="18" height="18" viewBox="0 0 20 20" fill="#00D4FF" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                  </span>
                )}
                {eng.kycVerified && (
                  <span title="KYC verified" aria-label="KYC verified">
                    <svg width="18" height="18" viewBox="0 0 20 20" fill="#F59E0B" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                  </span>
                )}
                <TierBadge tier={eng.tier} />
              </div>
              <p className="text-text-secondary text-sm md:text-base">{eng.headline}</p>
              <div className="flex items-center gap-1.5 mt-1.5 text-text-muted text-xs">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M8 1.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM0 8a8 8 0 1116 0A8 8 0 010 8z" clipRule="evenodd"/>
                  <path d="M8 4.5a.5.5 0 01.5.5v3.793l2.146 2.147a.5.5 0 01-.708.707L7.5 9.207V5a.5.5 0 01.5-.5z"/>
                </svg>
                {eng.location}
              </div>
            </div>

            {/* NeuronScore ring — desktop */}
            <div className="hidden sm:block shrink-0" data-testid="neuron-score-ring">
              <NeuronScoreRing score={eng.neuronScore} size={80} strokeWidth={5} />
            </div>
          </div>

          {/* Availability pill */}
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <span
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border',
                eng.availability === 'available'
                  ? 'bg-[rgba(16,185,129,0.1)] text-accent-green border-[rgba(16,185,129,0.2)]'
                  : eng.availability === 'soon'
                  ? 'bg-[rgba(245,158,11,0.1)] text-accent-amber border-[rgba(245,158,11,0.2)]'
                  : 'bg-[rgba(255,255,255,0.05)] text-text-muted border-[rgba(255,255,255,0.1)]'
              )}
            >
              <span
                className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  eng.availability === 'available' ? 'bg-accent-green animate-pulse' : '',
                  eng.availability === 'soon' ? 'bg-accent-amber' : '',
                  eng.availability === 'unavailable' ? 'bg-text-muted' : ''
                )}
              />
              {eng.availabilityLabel}
            </span>

            {/* Rate with currency toggle */}
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'font-mono font-semibold text-accent-cyan text-lg transition-all duration-150',
                  rateVisible ? 'animate-flip-up opacity-100' : 'opacity-0'
                )}
                data-testid="hourly-rate"
                aria-live="polite"
                aria-label={`Hourly rate: ${displayRate}`}
              >
                {displayRate}
              </span>
              <button
                onClick={toggleCurrency}
                className="text-xs px-2 py-0.5 rounded border border-[rgba(255,255,255,0.1)] text-text-muted hover:text-text-secondary hover:border-[rgba(255,255,255,0.2)] transition-all font-mono"
                aria-label={`Switch to ${currency === 'INR' ? 'USD' : 'INR'}`}
                data-testid="currency-toggle"
              >
                {currency === 'INR' ? '$ USD' : '₹ INR'}
              </button>
            </div>
          </div>

          {/* Stats row */}
          <div
            className="flex flex-wrap gap-x-6 gap-y-3 mb-6 pb-6 border-b border-[rgba(255,255,255,0.06)]"
            role="list"
            aria-label="Profile statistics"
          >
            {[
              { label: 'Rating', value: `${eng.rating}★`, mono: true },
              { label: 'Projects', value: String(eng.projectCount), mono: true },
              { label: 'Reviews', value: String(eng.reviewCount), mono: true },
              { label: 'Response Rate', value: `${eng.responseRate}%`, mono: true },
              { label: 'Avg Response', value: eng.avgResponseTime, mono: false },
            ].map((stat, i, arr) => (
              <div key={stat.label} className="flex items-center gap-4" role="listitem">
                <div>
                  <p className={cn('text-sm font-semibold text-text-primary', stat.mono && 'font-mono')}>
                    {stat.value}
                  </p>
                  <p className="text-xs text-text-muted">{stat.label}</p>
                </div>
                {i < arr.length - 1 && (
                  <div className="w-px h-8 bg-[rgba(255,255,255,0.06)]" aria-hidden="true" />
                )}
              </div>
            ))}
          </div>

          {/* Top skills */}
          <div className="flex flex-wrap gap-2 mb-6">
            {eng.skills.slice(0, 6).map((skill) => (
              <button
                key={skill.name}
                className="px-3 py-1 rounded-lg text-xs font-mono text-text-secondary border border-[rgba(255,255,255,0.08)] hover:border-[rgba(0,212,255,0.3)] hover:text-accent-cyan transition-all duration-200"
                aria-label={`Skill: ${skill.name}`}
              >
                {skill.name}
              </button>
            ))}
          </div>

          {/* CTA buttons */}
          <div className="flex flex-wrap gap-3">
            <HireDropdown />
            <Button variant="secondary" size="md">
              <MessageIcon /> Message
            </Button>
            <Button variant="ghost" size="md">
              <FollowIcon /> Follow
            </Button>
            <Button variant="ghost" size="md">
              <SaveIcon /> Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function HireDropdown() {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const modes = ['Full-time', 'Hourly Contract', 'Project Contract', 'Internship'];

  return (
    <div className="relative" ref={ref}>
      <Button
        size="md"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        Hire
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" className={cn('transition-transform', open && 'rotate-180')} aria-hidden="true">
          <path d="M2 4l4 4 4-4"/>
        </svg>
      </Button>
      {open && (
        <div
          className="absolute top-full left-0 mt-2 w-48 bg-bg-elevated border border-[rgba(255,255,255,0.08)] rounded-xl shadow-xl z-50 overflow-hidden"
          role="listbox"
          aria-label="Hiring mode"
        >
          {modes.map((mode) => (
            <button
              key={mode}
              role="option"
              aria-selected={false}
              className="w-full text-left px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-[rgba(255,255,255,0.04)] transition-colors"
              onClick={() => setOpen(false)}
            >
              {mode}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function MessageIcon() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 2H2a1 1 0 00-1 1v8a1 1 0 001 1h3l3 3 3-3h3a1 1 0 001-1V3a1 1 0 00-1-1z"/></svg>;
}
function FollowIcon() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 1v14M1 8h14"/></svg>;
}
function SaveIcon() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 2h10a1 1 0 011 1v11l-6-3-6 3V3a1 1 0 011-1z"/></svg>;
}
