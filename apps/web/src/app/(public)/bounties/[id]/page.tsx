'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { apiFetch } from '@/lib/api-fetch';
import { mapApiTaskToBountyCard } from '@/lib/map-task-to-bounty';

export default function PublicBountyDetailPage({ params }: { params: { id: string } }) {
  const { data: bounty, isLoading, error } = useQuery({
    queryKey: ['tasks', 'public', params.id],
    queryFn: async () => {
      const raw = await apiFetch<Record<string, unknown>>(`/api/tasks/${params.id}`);
      return mapApiTaskToBountyCard(raw);
    },
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16 space-y-4">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-12 w-40" />
      </div>
    );
  }

  if (error || !bounty) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16 text-center">
        <h1 className="font-display text-2xl font-bold text-text-primary mb-2">Bounty not found</h1>
        <p className="text-text-secondary text-sm mb-6">This bounty may have closed or does not exist.</p>
        <Link href="/bounties" className="text-accent-cyan hover:underline text-sm">
          ← Back to bounties
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <nav className="text-xs text-text-muted mb-6 flex items-center gap-2">
        <Link href="/bounties" className="hover:text-text-secondary">
          Bounties
        </Link>
        <span>/</span>
        <span className="text-text-secondary truncate">{bounty.title}</span>
      </nav>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Badge variant="amber" className="capitalize">
          {bounty.type}
        </Badge>
        <Badge variant="gray" className="capitalize">
          {bounty.difficulty}
        </Badge>
      </div>

      <h1 className="font-display text-3xl font-bold text-text-primary mb-4">{bounty.title}</h1>

      {bounty.description ? (
        <p className="text-text-secondary leading-relaxed mb-8 whitespace-pre-wrap">{bounty.description}</p>
      ) : null}

      <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl p-6 mb-8">
        <p className="text-xs text-text-muted mb-1">Reward</p>
        <p className="font-display font-bold text-accent-amber text-3xl">
          ₹{bounty.reward.toLocaleString('en-IN')}
        </p>
        {bounty.minNeuronScore > 0 && (
          <p className="text-sm text-text-muted mt-3">
            Minimum NeuronScore: <span className="text-text-secondary">{bounty.minNeuronScore}</span>
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href={`/login?redirect_url=/engineer/bounties/${params.id}`}>
          <Button>Sign in to participate</Button>
        </Link>
        <Link href="/bounties">
          <Button variant="secondary">All bounties</Button>
        </Link>
      </div>
    </div>
  );
}
