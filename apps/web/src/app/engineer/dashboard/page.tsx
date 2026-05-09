'use client';

import * as React from 'react';
import Link from 'next/link';
import { NeuronScoreRing } from '@/components/ui/neuron-score-ring';
import { Badge, TierBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton, CardSkeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  useEngineerDashboard,
  useRecommendedBounties,
  useEngineerActivity,
  type RecommendedBounty,
  type ActivityItem,
} from '@/lib/api-hooks';
import { useUser } from '@clerk/nextjs';

const DIFF_VARIANT = {
  easy:   'green',
  medium: 'cyan',
  hard:   'amber',
  expert: 'violet',
} as const;

const ACTIVITY_ICONS: Record<string, string> = {
  payment_received:  '💰',
  new_message:       '✉️',
  proposal_accepted: '🎯',
  proposal_pending:  '📋',
  proposal_rejected: '❌',
  contract_started:  '📝',
  score_updated:     '⭐',
  bounty_won:        '🏆',
  review_received:   '⭐',
};

const ACTIVITY_COLORS: Record<string, string> = {
  payment_received:  '#10B981',
  new_message:       '#00D4FF',
  proposal_accepted: '#7B5EA7',
  proposal_pending:  '#F59E0B',
  contract_started:  '#00D4FF',
  score_updated:     '#F59E0B',
  bounty_won:        '#F59E0B',
  review_received:   '#F59E0B',
};

export default function EngineerDashboardPage() {
  const { user } = useUser();
  const firstName = user?.firstName || 'there';

  const { data: stats, isLoading: statsLoading } = useEngineerDashboard();
  const { data: bounties, isLoading: bountiesLoading } = useRecommendedBounties(3);
  const { data: activity, isLoading: activityLoading } = useEngineerActivity(5);

  const [tipDismissed, setTipDismissed] = React.useState(false);

  // Build stat cards from real data
  const statCards = stats ? [
    {
      label: 'Active Contracts',
      value: String(stats.activeContracts.count),
      trend: stats.activeContracts.trend,
      trendLabel: 'vs last month',
      color: '#00D4FF',
    },
    {
      label: 'Pending Proposals',
      value: String(stats.pendingProposals.count),
      trend: stats.pendingProposals.trend,
      trendLabel: 'vs last month',
      color: '#7B5EA7',
    },
    {
      label: 'Marketplace Revenue',
      value: stats.marketplaceRevenue.amount > 0
        ? `₹${(stats.marketplaceRevenue.amount / 1000).toFixed(0)}K`
        : '₹0',
      trend: stats.marketplaceRevenue.trend,
      trendLabel: '% vs last month',
      color: '#F59E0B',
    },
    {
      label: 'Unread Messages',
      value: String(stats.unreadMessages.count),
      trend: 0,
      trendLabel: 'messages',
      color: '#10B981',
    },
  ] : null;

  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">

        {/* ── Welcome banner ──────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-text-primary">
              Welcome back, {firstName}. 👋
            </h1>
            <p className="text-text-secondary text-sm mt-1">
              Here&apos;s what&apos;s happening with your profile today.
            </p>
          </div>
          {stats && (
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm text-accent-cyan">
                ₹{stats.walletBalance.toLocaleString('en-IN')} balance
              </span>
            </div>
          )}
        </div>

        {/* ── Stat cards ──────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statsLoading || !statCards
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl p-5 space-y-3">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-7 w-16" />
                  <Skeleton className="h-3 w-20" />
                </div>
              ))
            : statCards.map((card) => (
                <StatCard key={card.label} {...card} />
              ))
          }
        </div>

        {/* ── Main grid: bounties + activity ──────────────── */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recommended bounties — 2/3 width */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-semibold text-text-primary">Recommended Bounties</h2>
              <Link href="/engineer/bounties" className="text-xs text-accent-cyan hover:underline">
                View all →
              </Link>
            </div>

            {bountiesLoading ? (
              Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)
            ) : !bounties || bounties.length === 0 ? (
              <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl p-8 text-center">
                <p className="text-text-muted text-sm">No matching bounties right now.</p>
                <p className="text-text-muted text-xs mt-1">Add more skills to your profile to see recommendations.</p>
                <Link href="/engineer/profile" className="mt-3 inline-block text-xs text-accent-cyan hover:underline">
                  Update skills →
                </Link>
              </div>
            ) : (
              bounties.map((b) => <BountyCard key={b.id} bounty={b} />)
            )}
          </div>

          {/* Activity feed — 1/3 width */}
          <div className="space-y-4">
            <h2 className="font-display font-semibold text-text-primary">Recent Activity</h2>
            <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl overflow-hidden">
              {activityLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 border-b border-[rgba(255,255,255,0.04)] last:border-0">
                    <Skeleton circle className="w-8 h-8 shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-2.5 w-16" />
                    </div>
                  </div>
                ))
              ) : !activity || activity.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-text-muted text-sm">No activity yet.</p>
                  <p className="text-text-muted text-xs mt-1">Start applying to bounties!</p>
                </div>
              ) : (
                activity.map((item, i) => (
                  <ActivityRow key={item.id} item={item} index={i} />
                ))
              )}
            </div>
          </div>
        </div>

        {/* ── Profile strength widget ──────────────────────── */}
        {!tipDismissed && (
          <ProfileStrengthWidget onDismiss={() => setTipDismissed(true)} />
        )}

      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────
function StatCard({
  label, value, trend, trendLabel, color,
}: {
  label: string; value: string; trend: number; trendLabel: string; color: string;
}) {
  const isPositive = trend > 0;
  const showTrend = trend !== 0;
  return (
    <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl p-5 hover:border-[rgba(255,255,255,0.1)] transition-all duration-200 animate-fade-up">
      <p className="text-xs text-text-muted mb-2">{label}</p>
      <p className="font-mono font-bold text-2xl text-text-primary mb-2" style={{ color }}>
        {value}
      </p>
      {showTrend ? (
        <div className="flex items-center gap-1">
          <span className={cn('text-xs font-mono font-medium', isPositive ? 'text-accent-green' : 'text-accent-red')}>
            {isPositive ? '↑' : '↓'} {Math.abs(trend)}
          </span>
          <span className="text-[10px] text-text-muted">{trendLabel}</span>
        </div>
      ) : (
        <p className="text-[10px] text-text-muted">{trendLabel}</p>
      )}
    </div>
  );
}

// ─── Bounty Card ──────────────────────────────────────────────
function BountyCard({ bounty: b }: { bounty: RecommendedBounty }) {
  const diffVariant = DIFF_VARIANT[b.difficulty.toLowerCase() as keyof typeof DIFF_VARIANT] ?? 'gray';
  const daysLeft = b.daysLeft !== null ? `${b.daysLeft} days` : 'No deadline';

  return (
    <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl p-5 hover:border-[rgba(0,212,255,0.2)] hover:-translate-y-0.5 transition-all duration-200 animate-fade-up">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-display font-bold text-bg-base text-xs shrink-0 bg-accent-cyan"
            aria-hidden="true"
          >
            {b.company.name.slice(0, 2).toUpperCase()}
          </div>
          <span className="text-xs text-text-muted">{b.company.name}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant={diffVariant} className="text-[10px] capitalize">
            {b.difficulty}
          </Badge>
          {b.matchPercentage > 0 && (
            <span className="text-[10px] font-mono text-accent-green bg-[rgba(16,185,129,0.1)] px-1.5 py-0.5 rounded">
              {b.matchPercentage}% match
            </span>
          )}
        </div>
      </div>

      <h3 className="text-sm font-medium text-text-primary mb-3 leading-snug line-clamp-2">{b.title}</h3>

      <div className="flex items-center justify-between">
        <div>
          <p className="font-display font-bold text-accent-amber text-lg leading-none">
            ₹{b.rewardAmount.toLocaleString('en-IN')}
          </p>
          <p className="text-[10px] text-text-muted font-mono mt-0.5">{daysLeft} left</p>
        </div>
        <Link href={`/engineer/bounties/${b.id}`}>
          <Button size="sm" className="h-8 text-xs">Apply</Button>
        </Link>
      </div>
    </div>
  );
}

// ─── Activity Row ─────────────────────────────────────────────
function ActivityRow({ item, index }: { item: ActivityItem; index: number }) {
  const icon = ACTIVITY_ICONS[item.type] || '📌';
  const color = ACTIVITY_COLORS[item.type] || '#8892A4';

  return (
    <div
      className="flex items-start gap-3 p-4 border-b border-[rgba(255,255,255,0.04)] last:border-0 hover:bg-[rgba(255,255,255,0.02)] transition-colors animate-fade-up"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0"
        style={{ background: `${color}15`, border: `1px solid ${color}25` }}
        aria-hidden="true"
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-text-secondary leading-relaxed">{item.message}</p>
        <p className="text-[10px] text-text-muted font-mono mt-1">{item.timestamp}</p>
      </div>
    </div>
  );
}

// ─── Profile Strength Widget ──────────────────────────────────
function ProfileStrengthWidget({ onDismiss }: { onDismiss: () => void }) {
  const tips = [
    'Add a demo URL to your projects to increase hire requests by ~40%.',
    'Engineers with 5+ projects get 3× more profile views.',
    'Keeping your availability status updated boosts search ranking.',
  ];
  const [tipIndex, setTipIndex] = React.useState(0);

  return (
    <div
      className="bg-[rgba(0,212,255,0.04)] border border-[rgba(0,212,255,0.15)] rounded-xl p-5 flex items-start gap-4 animate-fade-up"
      role="status"
      aria-label="AI profile tip"
    >
      <div className="w-9 h-9 rounded-xl bg-[rgba(0,212,255,0.1)] border border-[rgba(0,212,255,0.2)] flex items-center justify-center shrink-0">
        <svg width="16" height="16" viewBox="0 0 20 20" fill="#00D4FF" aria-hidden="true">
          <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd"/>
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-xs font-medium text-accent-cyan">Profile Tip</p>
          <span className="text-[10px] text-text-muted font-mono">{tipIndex + 1}/{tips.length}</span>
        </div>
        <p className="text-sm text-text-secondary leading-relaxed">{tips[tipIndex]}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => setTipIndex((i) => (i + 1) % tips.length)}
          className="text-xs text-text-muted hover:text-text-secondary transition-colors"
          aria-label="Next tip"
        >
          Next →
        </button>
        <button
          onClick={onDismiss}
          className="text-text-muted hover:text-text-primary transition-colors"
          aria-label="Dismiss tip"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
            <path d="M1 1l12 12M13 1L1 13"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
