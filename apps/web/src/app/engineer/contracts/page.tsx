'use client';

import * as React from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useMyContracts } from '@/lib/api-hooks';

const STATUS_BADGE: Record<string, { variant: 'cyan' | 'green' | 'amber' | 'red' | 'gray'; label: string }> = {
  draft:             { variant: 'gray',  label: 'Draft' },
  pending_signature: { variant: 'amber', label: 'Pending Signature' },
  active:            { variant: 'cyan',  label: 'Active' },
  completed:         { variant: 'green', label: 'Completed' },
  terminated:        { variant: 'red',   label: 'Terminated' },
  disputed:          { variant: 'red',   label: 'Disputed' },
};

const COLORS = ['#00D4FF', '#F59E0B', '#7B5EA7', '#10B981', '#EF4444'];
function colorFromName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

export default function EngineerContractsPage() {
  const [filter, setFilter] = React.useState<'all' | 'active' | 'completed' | 'pending_signature'>('all');
  const { data: contracts, isLoading } = useMyContracts(filter === 'all' ? undefined : filter);

  const filtered = contracts ?? [];

  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-text-primary">Contracts</h1>
            <p className="text-text-secondary text-sm mt-1">All your active and past contracts</p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 border-b border-[rgba(255,255,255,0.06)] pb-0">
          {(['all', 'active', 'pending_signature', 'completed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-4 py-2.5 text-sm font-medium transition-all relative',
                filter === f ? 'text-text-primary' : 'text-text-muted hover:text-text-secondary'
              )}
            >
              {f === 'all' ? 'All' : f === 'pending_signature' ? 'Pending' : f.charAt(0).toUpperCase() + f.slice(1)}
              {filter === f && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-cyan rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton rounded className="h-5 w-16" />
                </div>
                <Skeleton className="h-3 w-32" />
                <div className="flex gap-4">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-text-muted text-sm">No contracts found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((contract) => {
              const statusConfig = STATUS_BADGE[contract.status] ?? STATUS_BADGE.draft;
              const releasedPct = contract.totalAmount > 0 ? (contract.escrowReleased / contract.totalAmount) * 100 : 0;

              return (
                <Link
                  key={contract.id}
                  href={`/engineer/contracts/${contract.id}`}
                  className="block bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl p-5 hover:border-[rgba(0,212,255,0.2)] hover:-translate-y-0.5 transition-all duration-200"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center font-display font-bold text-bg-base text-xs shrink-0"
                        style={{ background: colorFromName(contract.companyName) }}
                        aria-hidden="true"
                      >
                        {contract.companyName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-display font-semibold text-text-primary text-sm">{contract.title}</p>
                        <p className="text-xs text-text-muted">{contract.companyName}</p>
                      </div>
                    </div>
                    <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                  </div>

                  <div className="flex flex-wrap gap-6 text-xs text-text-muted mb-3">
                    <span>
                      <span className="text-text-secondary font-mono font-semibold">₹{contract.totalAmount.toLocaleString('en-IN')}</span>
                      {' '}total value
                    </span>
                    <span>
                      <span className="text-accent-green font-mono font-semibold">₹{contract.escrowReleased.toLocaleString('en-IN')}</span>
                      {' '}released
                    </span>
                    <span className="capitalize">{contract.hiringMode?.replace('_', ' ')}</span>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1.5 bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent-green rounded-full transition-all duration-700"
                      style={{ width: `${releasedPct}%` }}
                    />
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
