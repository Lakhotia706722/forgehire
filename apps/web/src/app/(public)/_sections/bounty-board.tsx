'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useFeaturedBounties, type FeaturedBounty } from '@/lib/api-hooks';
import { avatarToneClass, initialsFromName } from '@/lib/avatar-tone';

const DIFFICULTY_VARIANT: Record<string, 'green' | 'cyan' | 'amber' | 'violet'> = {
  easy:   'green',
  medium: 'cyan',
  hard:   'amber',
  expert: 'violet',
};

function BountyCardSkeleton() {
  return (
    <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Skeleton circle className="w-10 h-10" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <div className="flex gap-1.5">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div className="flex justify-between">
        <div className="space-y-1">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-7 w-24" />
        </div>
        <div className="space-y-1 text-right">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    </div>
  );
}

function EmptyBountyCard() {
  return (
    <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl p-6 flex flex-col items-center justify-center h-[240px]">
      <p className="text-text-muted text-sm">No active bounties</p>
      <p className="text-text-muted text-xs mt-1">Check back soon</p>
    </div>
  );
}

function useCountdown(daysLeft: number | null) {
  if (daysLeft === null) return 'No deadline';
  if (daysLeft <= 0) return 'Expired';
  if (daysLeft === 1) return '1 day left';
  return `${daysLeft} days left`;
}

function BountyCard({ bounty }: { bounty: FeaturedBounty }) {
  const countdown = useCountdown(bounty.daysLeft);
  const companyName = bounty.company?.name ?? 'Company';
  const companyAvatarClass = avatarToneClass(companyName);
  const companyInitials = initialsFromName(companyName);
  const difficultyVariant =
    DIFFICULTY_VARIANT[(bounty.difficulty ?? '').toLowerCase()] ?? 'gray';
  const categories = Array.isArray(bounty.category) ? bounty.category : [];
  const rewardAmount = Number(bounty.rewardAmount ?? 0);

  return (
    <article className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl p-6 hover:border-[rgba(245,158,11,0.25)] hover:-translate-y-0.5 transition-all duration-300 group">
      <div className="flex items-start justify-between gap-4 mb-4">
        {/* Company */}
        <div className="flex items-center gap-3">
          {bounty.company?.logoUrl ? (
            <Image
              src={bounty.company.logoUrl}
              alt={companyName}
              width={40}
              height={40}
              unoptimized
              className="h-10 w-10 rounded-lg object-cover"
            />
          ) : (
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center font-display font-bold text-bg-base text-xs shrink-0 ${companyAvatarClass}`}
              aria-hidden="true"
            >
              {companyInitials}
            </div>
          )}
          <span className="text-text-secondary text-sm">{companyName}</span>
        </div>

        {/* Difficulty */}
        <Badge variant={difficultyVariant} className="capitalize">
          {bounty.difficulty}
        </Badge>
      </div>

      {/* Title */}
      <h3 className="font-display font-semibold text-text-primary text-base mb-3 group-hover:text-accent-amber transition-colors leading-snug line-clamp-2">
        {bounty.title}
      </h3>

      {/* Categories */}
      <div className="flex flex-wrap gap-1.5 mb-5">
        {categories.slice(0, 3).map((c) => (
          <Badge key={c} variant="gray" className="text-[10px]">{c}</Badge>
        ))}
      </div>

      {/* Bottom row */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-text-muted mb-0.5">Reward</p>
          <p className="font-display font-bold text-accent-amber text-2xl leading-none">
            ₹{rewardAmount.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-text-muted mb-0.5">Deadline</p>
          <p className="font-mono text-sm text-text-secondary">{countdown}</p>
        </div>
      </div>
    </article>
  );
}

export function BountyBoardSection() {
  const { data: bounties, isLoading, error } = useFeaturedBounties();

  return (
    <section className="py-24 px-6" aria-labelledby="bounty-board-heading">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-xs font-mono text-accent-amber uppercase tracking-widest">
              Live Bounties
            </span>
            <h2 id="bounty-board-heading" className="font-display text-3xl font-bold text-text-primary mt-1">
              Earn Big. Build Real.
            </h2>
          </div>
          <Link href="/bounties" className="text-sm text-accent-cyan hover:underline hidden sm:block">
            View all bounties →
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <BountyCardSkeleton key={i} />)
          ) : error || !bounties || bounties.length === 0 ? (
            Array.from({ length: 3 }).map((_, i) => <EmptyBountyCard key={i} />)
          ) : (
            bounties.map((b) => (
              <Link key={b.id} href={`/bounties/${b.id}`} className="block">
                <BountyCard bounty={b} />
              </Link>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
