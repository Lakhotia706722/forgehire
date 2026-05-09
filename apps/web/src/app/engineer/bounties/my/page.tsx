'use client';

import * as React from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const MOCK_MY_BOUNTIES = [
  {
    id: 'b1',
    title: 'Multilingual Voice AI Agent for Customer Support',
    company: 'Sarvam AI',
    companyColor: '#00D4FF',
    companyInitials: 'SA',
    reward: 150000,
    status: 'participating',
    deadline: '2026-05-20',
    submittedAt: null,
    rank: null,
  },
  {
    id: 'b2',
    title: 'Fraud Detection System Using Graph Neural Networks',
    company: 'Razorpay',
    companyColor: '#F59E0B',
    companyInitials: 'RP',
    reward: 200000,
    status: 'submitted',
    deadline: '2026-05-15',
    submittedAt: '2026-05-10',
    rank: null,
  },
  {
    id: 'b3',
    title: 'Demand Forecasting Model with Real-time Inventory Signals',
    company: 'Zepto',
    companyColor: '#7B5EA7',
    companyInitials: 'ZP',
    reward: 80000,
    status: 'winner',
    deadline: '2026-04-30',
    submittedAt: '2026-04-28',
    rank: 1,
  },
  {
    id: 'b4',
    title: 'LLM-powered Code Review Automation',
    company: 'GitHub India',
    companyColor: '#10B981',
    companyInitials: 'GH',
    reward: 120000,
    status: 'rejected',
    deadline: '2026-04-15',
    submittedAt: '2026-04-14',
    rank: null,
  },
];

const STATUS_CONFIG: Record<string, { variant: 'cyan' | 'green' | 'amber' | 'red' | 'gray' | 'violet'; label: string }> = {
  participating: { variant: 'cyan',   label: 'Participating' },
  submitted:     { variant: 'amber',  label: 'Under Review' },
  winner:        { variant: 'green',  label: 'Winner 🏆' },
  rejected:      { variant: 'gray',   label: 'Not Selected' },
};

export default function MyBountiesPage() {
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<'all' | 'participating' | 'submitted' | 'winner' | 'rejected'>('all');

  React.useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  const filtered = MOCK_MY_BOUNTIES.filter((b) => filter === 'all' || b.status === filter);

  const stats = {
    total: MOCK_MY_BOUNTIES.length,
    wins: MOCK_MY_BOUNTIES.filter((b) => b.status === 'winner').length,
    earnings: MOCK_MY_BOUNTIES.filter((b) => b.status === 'winner').reduce((s, b) => s + b.reward, 0),
  };

  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-text-primary">My Bounties</h1>
            <p className="text-text-secondary text-sm mt-1">Your applications and submissions</p>
          </div>
          <Link
            href="/engineer/bounties"
            className="text-sm text-accent-cyan hover:underline"
          >
            Browse bounties →
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Applied',  value: stats.total,                                    color: '#00D4FF' },
            { label: 'Wins',           value: stats.wins,                                     color: '#F59E0B' },
            { label: 'Total Earned',   value: `₹${(stats.earnings / 1000).toFixed(0)}K`,      color: '#10B981' },
          ].map((s) => (
            <div key={s.label} className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl p-4 text-center">
              <p className="font-mono font-bold text-2xl" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs text-text-muted mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 border-b border-[rgba(255,255,255,0.06)]">
          {(['all', 'participating', 'submitted', 'winner', 'rejected'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-4 py-2.5 text-sm font-medium transition-all relative capitalize',
                filter === f ? 'text-text-primary' : 'text-text-muted hover:text-text-secondary'
              )}
            >
              {f === 'all' ? 'All' : STATUS_CONFIG[f]?.label ?? f}
              {filter === f && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-cyan rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl p-5 space-y-3">
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-3 w-32" />
                <div className="flex gap-4">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-text-muted text-sm">No bounties found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((bounty) => {
              const statusConfig = STATUS_CONFIG[bounty.status];
              return (
                <Link
                  key={bounty.id}
                  href={`/engineer/bounties/${bounty.id}`}
                  className="block bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl p-5 hover:border-[rgba(0,212,255,0.2)] hover:-translate-y-0.5 transition-all duration-200"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center font-display font-bold text-bg-base text-xs shrink-0"
                        style={{ background: bounty.companyColor }}
                        aria-hidden="true"
                      >
                        {bounty.companyInitials}
                      </div>
                      <div>
                        <p className="font-display font-semibold text-text-primary text-sm">{bounty.title}</p>
                        <p className="text-xs text-text-muted">{bounty.company}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {bounty.rank === 1 && (
                        <span className="text-xs font-mono text-accent-amber">🥇 1st Place</span>
                      )}
                      <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-6 text-xs text-text-muted">
                    <span>
                      Reward: <span className="text-accent-amber font-mono font-semibold">₹{bounty.reward.toLocaleString('en-IN')}</span>
                    </span>
                    <span>Deadline: {new Date(bounty.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                    {bounty.submittedAt && (
                      <span>Submitted: {new Date(bounty.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                    )}
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
