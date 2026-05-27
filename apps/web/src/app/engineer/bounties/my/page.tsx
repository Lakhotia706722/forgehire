'use client';

import * as React from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { avatarToneClass } from '@/lib/avatar-tone';
import { useMyBountySubmissions } from '@/lib/api-hooks';

const STATUS_CONFIG: Record<string, { variant: 'cyan' | 'green' | 'amber' | 'red' | 'gray' | 'violet'; label: string }> = {
  participating: { variant: 'cyan',   label: 'Participating' },
  pending:       { variant: 'cyan',   label: 'Participating' },
  submitted:     { variant: 'amber',  label: 'Under Review' },
  accepted:      { variant: 'amber',  label: 'Under Review' },
  winner:        { variant: 'green',  label: 'Winner 🏆' },
  rejected:      { variant: 'gray',   label: 'Not Selected' },
};

const COLORS = ['#00D4FF', '#F59E0B', '#7B5EA7', '#10B981'];

function colorFromName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

function initials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function MyBountiesPage() {
  const { data: submissions = [], isLoading } = useMyBountySubmissions();
  const [filter, setFilter] = React.useState<'all' | 'participating' | 'submitted' | 'winner' | 'rejected'>('all');

  const bounties = submissions.map((s) => ({
    id: s.taskId,
    title: s.taskTitle,
    company: s.companyName,
    companyColor: colorFromName(s.companyName),
    companyInitials: initials(s.companyName),
    reward: s.reward,
    status: s.status === 'pending' ? 'participating' : s.status,
    submittedAt: s.submittedAt,
  }));

  const filtered = bounties.filter((b) => filter === 'all' || b.status === filter);

  const stats = {
    total: bounties.length,
    wins: bounties.filter((b) => b.status === 'winner').length,
    earnings: bounties
      .filter((b) => b.status === 'winner')
      .reduce((s, b) => s + b.reward, 0),
  };

  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-text-primary">My Bounties</h1>
            <p className="text-text-secondary text-sm mt-1">Track your participations and submissions</p>
          </div>
          <Link href="/engineer/bounties" className="text-sm text-accent-cyan hover:underline">
            Browse bounties →
          </Link>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { label: 'Total', value: stats.total, valueClass: 'stat-value-cyan' },
            { label: 'Wins', value: stats.wins, valueClass: 'stat-value-green' },
            { label: 'Earnings', value: `₹${stats.earnings.toLocaleString('en-IN')}`, valueClass: 'stat-value-amber' },
          ].map((s) => (
            <div key={s.label} className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
              <p className="text-xs text-text-muted uppercase tracking-wider mb-1">{s.label}</p>
              <p className={cn('font-display text-2xl font-bold', s.valueClass)}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-2 flex-wrap" role="group" aria-label="Filter bounties">
          {(['all', 'participating', 'submitted', 'winner', 'rejected'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                filter === f
                  ? 'bg-accent-cyan text-bg-base'
                  : 'bg-bg-surface text-text-secondary border border-[rgba(255,255,255,0.06)]',
              )}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-text-muted text-sm">
            No bounties in this category.{' '}
            <Link href="/engineer/bounties" className="text-accent-cyan hover:underline">Find bounties</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((b) => {
              const cfg = STATUS_CONFIG[b.status] ?? STATUS_CONFIG.participating;
              return (
                <Link
                  key={b.id}
                  href={`/engineer/bounties/${b.id}`}
                  className="block bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl p-5 hover:border-[rgba(0,212,255,0.2)] transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={cn('w-10 h-10 rounded-xl flex items-center justify-center font-display font-bold text-bg-base text-xs shrink-0', avatarToneClass(b.company))}
                      aria-hidden="true"
                    >
                      {b.companyInitials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h2 className="font-medium text-text-primary text-sm">{b.title}</h2>
                        <Badge variant={cfg.variant}>{cfg.label}</Badge>
                      </div>
                      <p className="text-xs text-text-muted">{b.company}</p>
                      <p className="font-mono text-sm text-accent-cyan mt-2">
                        ₹{b.reward.toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
