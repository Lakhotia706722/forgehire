'use client';

import * as React from 'react';
import Link from 'next/link';
import { NeuronScoreRing } from '@/components/ui/neuron-score-ring';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useFeaturedEngineers, type FeaturedEngineer } from '@/lib/api-hooks';
import { avatarToneClass, initialsFromName } from '@/lib/avatar-tone';

function EngineerCardSkeleton() {
  return (
    <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl p-5 space-y-3">
      <div className="flex items-start justify-between">
        <Skeleton circle className="w-12 h-12" />
        <Skeleton className="w-[52px] h-[52px] rounded-full" />
      </div>
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-5 w-16 rounded-full" />
    </div>
  );
}

function EngineerCard({ engineer: eng }: { engineer: FeaturedEngineer }) {
  const name = eng.name || 'Engineer';
  const avatarClass = avatarToneClass(name);
  const initials = initialsFromName(name);
  const skills = Array.isArray(eng.skills) ? eng.skills : [];
  const hourlyRate = Number(eng.hourlyRate ?? 0);
  const neuronScore = Number(eng.neuronScore ?? 0);

  return (
    <Link href={`/engineer/${eng.id}`} className="block group">
      <article className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl p-5 hover:border-[rgba(0,212,255,0.25)] transition-colors h-full">
        <div className="flex items-start justify-between mb-4">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center font-display font-bold text-bg-base text-sm ${avatarClass}`}
            aria-hidden="true"
          >
            {initials}
          </div>
          <NeuronScoreRing score={neuronScore} size={52} strokeWidth={4} animate={false} />
        </div>
        <h2 className="font-display font-semibold text-text-primary text-sm mb-1 group-hover:text-accent-cyan transition-colors">
          {name}
        </h2>
        <p className="text-text-muted text-xs leading-relaxed mb-3 line-clamp-2">{eng.headline || ''}</p>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {skills.slice(0, 4).map((s) => (
            <Badge key={s} variant="gray" className="text-[10px] px-2 py-0.5">
              {s}
            </Badge>
          ))}
        </div>
        <p className="font-mono text-sm text-accent-cyan">₹{hourlyRate.toLocaleString('en-IN')}/hr</p>
      </article>
    </Link>
  );
}

export default function EngineersBrowsePage() {
  const { data: engineers, isLoading, error } = useFeaturedEngineers();

  return (
    <div className="max-w-7xl mx-auto px-6 py-16">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
        <div>
          <span className="text-xs font-mono text-accent-cyan uppercase tracking-widest">Talent</span>
          <h1 className="font-display text-3xl font-bold text-text-primary mt-1">Verified AI Engineers</h1>
          <p className="text-text-secondary text-sm mt-2 max-w-xl">
            Browse NeuronScore-verified engineers. Sign in to contact or hire.
          </p>
        </div>
        <Link href="/signup?role=company">
          <Button size="sm">Post a bounty</Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <EngineerCardSkeleton key={i} />
          ))}
        </div>
      ) : error || !engineers?.length ? (
        <div className="text-center py-16 border border-dashed border-[rgba(255,255,255,0.08)] rounded-xl">
          <p className="text-text-secondary">No featured engineers yet.</p>
          <Link href="/signup?role=engineer" className="mt-4 inline-block text-sm text-accent-cyan hover:underline">
            Join as an engineer →
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {engineers.map((eng) => (
            <EngineerCard key={eng.id} engineer={eng} />
          ))}
        </div>
      )}
    </div>
  );
}
