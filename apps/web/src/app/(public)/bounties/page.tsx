'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { apiFetchList } from '@/lib/api-fetch';
import { mapApiTaskToBountyCard } from '@/lib/map-task-to-bounty';
import { avatarToneClass, initialsFromName } from '@/lib/avatar-tone';

const DIFFICULTY_VARIANT: Record<string, 'green' | 'cyan' | 'amber' | 'violet'> = {
  easy: 'green',
  medium: 'cyan',
  hard: 'amber',
  expert: 'violet',
};

function BountyCardSkeleton() {
  return (
    <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl p-6 space-y-4">
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-8 w-24" />
    </div>
  );
}

export default function PublicBountiesPage() {
  const { data: bounties, isLoading } = useQuery({
    queryKey: ['tasks', 'public-bounties'],
    queryFn: async () => {
      try {
        const list = await apiFetchList<Record<string, unknown>>('/api/tasks?status=open&limit=24');
        return list.map(mapApiTaskToBountyCard);
      } catch {
        return [];
      }
    },
    staleTime: 60_000,
  });

  return (
    <div className="max-w-7xl mx-auto px-6 py-16">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
        <div>
          <span className="text-xs font-mono text-accent-amber uppercase tracking-widest">Bounties</span>
          <h1 className="font-display text-3xl font-bold text-text-primary mt-1">Open AI Bounties</h1>
          <p className="text-text-secondary text-sm mt-2 max-w-xl">
            Explore active bounties from companies. Sign in as an engineer to participate.
          </p>
        </div>
        <Link href="/login">
          <Button size="sm">Sign in to apply</Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <BountyCardSkeleton key={i} />
          ))}
        </div>
      ) : !bounties?.length ? (
        <div className="text-center py-16 border border-dashed border-[rgba(255,255,255,0.08)] rounded-xl">
          <p className="text-text-secondary">No open bounties right now.</p>
          <Link href="/signup?role=company" className="mt-4 inline-block text-sm text-accent-cyan hover:underline">
            Post the first bounty →
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bounties.map((b) => {
            const companyName = b.company ?? 'Company';
            const variant =
              DIFFICULTY_VARIANT[b.difficulty?.toLowerCase() ?? ''] ?? 'gray';
            return (
              <Link key={b.id} href={`/bounties/${b.id}`} className="block group">
                <article className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl p-6 hover:border-[rgba(245,158,11,0.25)] transition-colors h-full">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center font-display font-bold text-bg-base text-xs shrink-0 ${avatarToneClass(companyName)}`}
                      aria-hidden="true"
                    >
                      {initialsFromName(companyName)}
                    </div>
                    <Badge variant={variant} className="capitalize shrink-0">
                      {b.difficulty}
                    </Badge>
                  </div>
                  <h2 className="font-display font-semibold text-text-primary text-base mb-2 group-hover:text-accent-amber transition-colors line-clamp-2">
                    {b.title}
                  </h2>
                  <p className="text-text-muted text-sm line-clamp-2 mb-4">{b.description}</p>
                  <p className="font-display font-bold text-accent-amber text-xl">
                    ₹{b.reward.toLocaleString('en-IN')}
                  </p>
                </article>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
