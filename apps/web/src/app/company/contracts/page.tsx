'use client';

import * as React from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useMyContracts } from '@/lib/api-hooks';

const STATUS_BADGE: Record<string, { variant: 'cyan' | 'green' | 'amber' | 'red' | 'gray'; label: string }> = {
  draft:             { variant: 'gray',  label: 'Draft' },
  pending_signature: { variant: 'amber', label: 'Pending Signature' },
  active:            { variant: 'cyan',  label: 'Active' },
  completed:         { variant: 'green', label: 'Completed' },
  terminated:        { variant: 'red',   label: 'Terminated' },
};

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
}

export default function CompanyContractsPage() {
  const [filter, setFilter] = React.useState<'all' | 'active' | 'completed'>('all');
  const { data: contracts = [], isLoading, isError, refetch } = useMyContracts(filter === 'all' ? undefined : filter);

  const filtered = filter === 'all'
    ? contracts
    : contracts.filter((c) => c.status === filter);

  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 space-y-6">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-text-primary">Contracts</h1>
          <p className="text-text-secondary text-sm mt-1">All your active and past contracts</p>
        </div>

        <div className="flex gap-2 border-b border-[rgba(255,255,255,0.06)]">
          {(['all', 'active', 'completed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-4 py-2.5 text-sm font-medium transition-all relative capitalize',
                filter === f ? 'text-text-primary' : 'text-text-muted hover:text-text-secondary'
              )}
            >
              {f}
              {filter === f && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-cyan rounded-full" />}
            </button>
          ))}
        </div>

        {isError ? (
          <div className="text-center py-20">
            <p className="text-text-muted text-sm">Could not load contracts.</p>
            <Button className="mt-3" size="sm" variant="secondary" onClick={() => { void refetch(); }}>
              Retry
            </Button>
          </div>
        ) : isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl p-5 space-y-3">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-text-muted text-sm">No contracts yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((contract: any) => {
              const statusConfig = STATUS_BADGE[contract.status] ?? STATUS_BADGE.draft;
              const engineerName = contract.engineerProfile?.fullName ?? contract.engineerName ?? 'Engineer';
              const totalAmount = Number(contract.totalAmount ?? contract.rate ?? 0);
              const escrowReleased = Number(contract.escrowReleased ?? 0);
              const releasedPct = totalAmount > 0 ? (escrowReleased / totalAmount) * 100 : 0;
              const engInitials = initials(engineerName);

              return (
                <Link
                  key={contract.id}
                  href={`/company/contracts/${contract.id}`}
                  className="block bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl p-5 hover:border-[rgba(123,94,167,0.3)] hover:-translate-y-0.5 transition-all duration-200"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center font-display font-bold text-bg-base text-xs shrink-0 bg-accent-violet" aria-hidden="true">
                        {engInitials}
                      </div>
                      <div>
                        <p className="font-display font-semibold text-text-primary text-sm">{contract.title}</p>
                        <p className="text-xs text-text-muted">{engineerName}</p>
                      </div>
                    </div>
                    <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-6 text-xs text-text-muted mb-3">
                    <span>Value: <span className="text-text-secondary font-mono font-semibold">₹{totalAmount.toLocaleString('en-IN')}</span></span>
                    <span className="capitalize">{(contract.hiringMode ?? contract.mode ?? '').replace(/_/g, ' ')}</span>
                  </div>
                  {contract.hiringMode !== 'full_time' && (
                    <progress
                      className="progress-release w-full"
                      value={releasedPct}
                      max={100}
                      aria-label="Payment released"
                    />
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
