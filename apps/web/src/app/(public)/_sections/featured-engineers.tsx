'use client';

import * as React from 'react';
import Link from 'next/link';
import { NeuronScoreRing } from '@/components/ui/neuron-score-ring';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useFeaturedEngineers, type FeaturedEngineer } from '@/lib/api-hooks';

// Deterministic color from name
const COLORS = ['#F59E0B', '#00D4FF', '#7B5EA7', '#10B981', '#EF4444', '#8B5CF6'];
function colorFromName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}
function initialsFromName(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function EngineerCardSkeleton() {
  return (
    <div className="w-[280px] shrink-0">
      <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl p-5 space-y-3">
        <div className="flex items-start justify-between">
          <Skeleton circle className="w-12 h-12" />
          <Skeleton className="w-[52px] h-[52px] rounded-full" />
        </div>
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-full" />
        <div className="flex gap-1.5">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  );
}

function EmptyEngineerCard() {
  return (
    <div className="w-[280px] shrink-0">
      <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl p-5 flex flex-col items-center justify-center h-[240px] text-center">
        <p className="text-text-muted text-sm">No engineers yet</p>
        <p className="text-text-muted text-xs mt-1">Be the first to join</p>
      </div>
    </div>
  );
}

export function FeaturedEngineersSection() {
  const { data: engineers, isLoading, error } = useFeaturedEngineers();

  return (
    <section className="py-24 px-6" aria-labelledby="featured-engineers-heading">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-xs font-mono text-accent-cyan uppercase tracking-widest">
              Featured Engineers
            </span>
            <h2 id="featured-engineers-heading" className="font-display text-3xl font-bold text-text-primary mt-1">
              Top Verified AI Talent
            </h2>
          </div>
          <Link href="/engineers" className="text-sm text-accent-cyan hover:underline hidden sm:block">
            View all engineers →
          </Link>
        </div>

        {/* Horizontal scroll row */}
        <div className="scroll-row pb-4" role="list">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <EngineerCardSkeleton key={i} />)
          ) : error || !engineers || engineers.length === 0 ? (
            Array.from({ length: 3 }).map((_, i) => <EmptyEngineerCard key={i} />)
          ) : (
            engineers.map((eng) => <EngineerCard key={eng.id} engineer={eng} />)
          )}
        </div>

        <div className="mt-6 sm:hidden text-center">
          <Link href="/engineers" className="text-sm text-accent-cyan hover:underline">
            View all engineers →
          </Link>
        </div>
      </div>
    </section>
  );
}

function EngineerCard({ engineer: eng }: { engineer: FeaturedEngineer }) {
  const [tilt, setTilt] = React.useState({ x: 0, y: 0 });
  const color = colorFromName(eng.name);
  const initials = initialsFromName(eng.name);
  const isAvailable = eng.availabilityStatus === 'available_now';

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    setTilt({ x: dy * -4, y: dx * 4 });
  }

  function handleMouseLeave() {
    setTilt({ x: 0, y: 0 });
  }

  return (
    <div
      role="listitem"
      className="w-[280px] shrink-0"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <Link href={`/engineer/${eng.id}`} className="block">
        <div
          className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl p-5 hover:border-[rgba(0,212,255,0.25)] transition-all duration-300 cursor-pointer"
          style={{
            transform: `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateZ(0)`,
            transition: tilt.x === 0 && tilt.y === 0 ? 'transform 400ms cubic-bezier(0.16,1,0.3,1)' : 'transform 100ms linear',
          }}
        >
          {/* Avatar + score */}
          <div className="flex items-start justify-between mb-4">
            <div className="relative">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center font-display font-bold text-bg-base text-sm"
                style={{ background: color }}
                aria-hidden="true"
              >
                {initials}
              </div>
              {isAvailable && (
                <span
                  className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-accent-green border-2 border-bg-surface"
                  aria-label="Available now"
                />
              )}
            </div>
            <NeuronScoreRing score={eng.neuronScore} size={52} strokeWidth={4} animate={false} />
          </div>

          {/* Info */}
          <h3 className="font-display font-semibold text-text-primary text-sm mb-1">{eng.name}</h3>
          <p className="text-text-muted text-xs leading-relaxed mb-3 line-clamp-2">{eng.headline}</p>

          {/* Skills */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {eng.skills.slice(0, 3).map((s) => (
              <Badge key={s} variant="gray" className="text-[10px] px-2 py-0.5">{s}</Badge>
            ))}
          </div>

          {/* Rate */}
          <div className="flex items-center justify-between">
            <span className="font-mono text-sm text-accent-cyan">
              ₹{eng.hourlyRate.toLocaleString('en-IN')}/hr
            </span>
            <span className="text-xs text-text-muted">{isAvailable ? 'Available' : 'Busy'}</span>
          </div>
        </div>
      </Link>
    </div>
  );
}
