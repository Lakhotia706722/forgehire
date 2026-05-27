'use client';

import * as React from 'react';
import Link from 'next/link';
import { NeuronScoreRing } from '@/components/ui/neuron-score-ring';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useFeaturedEngineers, type FeaturedEngineer } from '@/lib/api-hooks';
import { avatarToneClass, initialsFromName } from '@/lib/avatar-tone';

function EngineerCardSkeleton() {
  return (
    <li className="w-[280px] shrink-0">
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
    </li>
  );
}

function EmptyEngineerCard() {
  return (
    <li className="w-[280px] shrink-0">
      <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl p-5 flex flex-col items-center justify-center h-[240px] text-center">
        <p className="text-text-muted text-sm">No engineers yet</p>
        <p className="text-text-muted text-xs mt-1">Be the first to join</p>
      </div>
    </li>
  );
}

export function FeaturedEngineersSection() {
  const { data: engineers, isLoading, error } = useFeaturedEngineers();

  return (
    <section className="py-24 px-6" aria-labelledby="featured-engineers-heading">
      <div className="max-w-7xl mx-auto">
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

        <ul className="scroll-row pb-4" aria-label="Featured engineers">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <EngineerCardSkeleton key={i} />)
          ) : error || !engineers || engineers.length === 0 ? (
            Array.from({ length: 3 }).map((_, i) => <EmptyEngineerCard key={i} />)
          ) : (
            engineers.map((eng) => <EngineerCard key={eng.id} engineer={eng} />)
          )}
        </ul>

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
  const cardRef = React.useRef<HTMLDivElement>(null);
  const name = eng.name || 'Engineer';
  const avatarClass = avatarToneClass(name);
  const initials = initialsFromName(name);
  const isAvailable = eng.availabilityStatus === 'available_now';
  const skills = Array.isArray(eng.skills) ? eng.skills : [];
  const hourlyRate = Number(eng.hourlyRate ?? 0);
  const neuronScore = Number(eng.neuronScore ?? 0);

  function setTilt(x: number, y: number, active: boolean) {
    const el = cardRef.current;
    if (!el) return;
    el.style.setProperty('--tilt-x', `${x}deg`);
    el.style.setProperty('--tilt-y', `${y}deg`);
    el.classList.toggle('is-active', active);
  }

  function handleMouseMove(e: React.MouseEvent<HTMLLIElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    setTilt(dy * -4, dx * 4, true);
  }

  function handleMouseLeave() {
    setTilt(0, 0, false);
  }

  return (
    <li
      className="w-[280px] shrink-0"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <Link href={`/engineer/${eng.id}`} className="block">
        <div
          ref={cardRef}
          className="engineer-card-tilt bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl p-5 hover:border-[rgba(0,212,255,0.25)] transition-colors duration-300 cursor-pointer"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="relative">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center font-display font-bold text-bg-base text-sm ${avatarClass}`}
                aria-hidden="true"
              >
                {initials}
              </div>
              {isAvailable && (
                <span
                  className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-accent-green border-2 border-bg-surface"
                  title="Available now"
                />
              )}
            </div>
            <NeuronScoreRing score={neuronScore} size={52} strokeWidth={4} animate={false} />
          </div>

          <h3 className="font-display font-semibold text-text-primary text-sm mb-1">{name}</h3>
          <p className="text-text-muted text-xs leading-relaxed mb-3 line-clamp-2">{eng.headline || ''}</p>

          <div className="flex flex-wrap gap-1.5 mb-4">
            {skills.slice(0, 3).map((s) => (
              <Badge key={s} variant="gray" className="text-[10px] px-2 py-0.5">{s}</Badge>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <span className="font-mono text-sm text-accent-cyan">
              ₹{hourlyRate.toLocaleString('en-IN')}/hr
            </span>
            <span className="text-xs text-text-muted">{isAvailable ? 'Available' : 'Busy'}</span>
          </div>
        </div>
      </Link>
    </li>
  );
}
