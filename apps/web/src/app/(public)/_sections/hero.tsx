'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { usePlatformStats } from '@/lib/api-hooks';
import { cn } from '@/lib/utils';

function StatBadge({ value, label, loading }: { value: string; label: string; loading: boolean }) {
  return (
    <div
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-bg-elevated border border-[rgba(0,212,255,0.15)] transition-all duration-300"
      aria-label={`${value} ${label}`}
    >
      {loading ? (
        <span className="font-mono font-semibold text-accent-cyan text-lg leading-none w-16 h-5 bg-[rgba(0,212,255,0.1)] rounded animate-pulse" />
      ) : (
        <span className="font-mono font-semibold text-accent-cyan text-lg leading-none">{value}</span>
      )}
      <span className="text-text-muted text-xs">{label}</span>
    </div>
  );
}

function formatCount(n: number): string {
  const value = Number(n ?? 0);
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K+`;
  return `${value}+`;
}

function formatPaidOut(n: number): string {
  const value = Number(n ?? 0);
  if (value >= 10_000_000) return `₹${(value / 10_000_000).toFixed(1)}Cr+`;
  if (value >= 100_000) return `₹${(value / 100_000).toFixed(0)}L+`;
  return `₹${value.toLocaleString('en-IN')}`;
}

const STAT_DELAY_CLASS = ['anim-delay-800', 'anim-delay-920', 'anim-delay-1040'] as const;

export function HeroSection() {
  const [statsVisible, setStatsVisible] = React.useState(false);
  const { data: stats, isLoading } = usePlatformStats();

  React.useEffect(() => {
    const t = setTimeout(() => setStatsVisible(true), 800);
    return () => clearTimeout(t);
  }, []);

  const statItems = [
    {
      value: stats ? formatCount(stats.activeBounties) : '—',
      label: 'Live Bounties',
    },
    {
      value: stats ? formatPaidOut(stats.totalPaidOut) : '—',
      label: 'Paid Out',
    },
    {
      value: stats ? formatCount(stats.verifiedEngineers) : '—',
      label: 'Verified Engineers',
    },
  ];

  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 overflow-hidden"
      aria-labelledby="hero-heading"
    >
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute w-[600px] h-[600px] rounded-full animate-blob-1 hero-blob-1" />
        <div className="absolute w-[500px] h-[500px] rounded-full animate-blob-2 hero-blob-2" />
        <div className="absolute w-[400px] h-[400px] rounded-full animate-blob-3 hero-blob-3" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[rgba(0,212,255,0.2)] bg-[rgba(0,212,255,0.05)] mb-8 animate-fade-up">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan animate-pulse" />
          <span className="text-xs font-mono text-accent-cyan tracking-wider uppercase">
            India&apos;s Only Verified AI Talent Network
          </span>
        </div>

        <h1
          id="hero-heading"
          className="font-display font-bold text-[clamp(2.5rem,7vw,4.5rem)] text-text-primary leading-[1.08] mb-6 animate-fade-up anim-delay-100"
        >
          India&apos;s Only{' '}
          <span className="text-transparent bg-clip-text text-gradient-brand">
            Verified AI
          </span>
          <br />
          Talent Network
        </h1>

        <p className="text-text-secondary text-[clamp(1rem,2.5vw,1.25rem)] max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-up anim-delay-200">
          Every engineer is assessed, scored, and ranked.
          <br className="hidden sm:block" />
          No noise. Only builders.
        </p>

        <div className="flex flex-wrap gap-4 justify-center mb-16 animate-fade-up anim-delay-300">
          <Link href="/signup?role=engineer">
            <Button size="lg" className="min-w-[180px]">
              Join as Engineer
            </Button>
          </Link>
          <Link href="/signup?role=company">
            <Button variant="secondary" size="lg" className="min-w-[180px]">
              Hire AI Talent
            </Button>
          </Link>
        </div>

        <div className="flex flex-wrap gap-3 justify-center">
          {statItems.map((stat, i) => (
            <div
              key={stat.label}
              className={cn(
                'transition-all duration-300',
                statsVisible ? 'animate-stat-pop opacity-100' : 'opacity-0',
                STAT_DELAY_CLASS[i],
              )}
            >
              <StatBadge value={stat.value} label={stat.label} loading={isLoading} />
            </div>
          ))}
        </div>
      </div>

      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 animate-fade-up anim-delay-1200"
        aria-hidden="true"
      >
        <span className="text-text-muted text-xs font-mono">scroll</span>
        <div className="w-px h-8 bg-gradient-to-b from-[rgba(0,212,255,0.4)] to-transparent" />
      </div>
    </section>
  );
}
