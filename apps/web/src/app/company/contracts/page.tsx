'use client';

import * as React from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const MOCK_CONTRACTS = [
  { id: 'c1', title: 'Voice AI Agent Development', engineerName: 'Arjun Sharma', initials: 'AS', color: '#F59E0B', status: 'active',    mode: 'project_contract', totalAmount: 150000, escrowReleased: 50000 },
  { id: 'c2', title: 'RAG Pipeline Integration',   engineerName: 'Priya Menon',  initials: 'PM', color: '#00D4FF', status: 'completed', mode: 'project_contract', totalAmount: 80000,  escrowReleased: 80000 },
  { id: 'c3', title: 'ML Engineer — Full Time',    engineerName: 'Rahul Kumar',  initials: 'RK', color: '#7B5EA7', status: 'active',    mode: 'full_time',        totalAmount: 1800000, escrowReleased: 0 },
];

const STATUS_BADGE: Record<string, { variant: 'cyan' | 'green' | 'amber' | 'red' | 'gray'; label: string }> = {
  draft:             { variant: 'gray',  label: 'Draft' },
  pending_signature: { variant: 'amber', label: 'Pending Signature' },
  active:            { variant: 'cyan',  label: 'Active' },
  completed:         { variant: 'green', label: 'Completed' },
  terminated:        { variant: 'red',   label: 'Terminated' },
};

export default function CompanyContractsPage() {
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<'all' | 'active' | 'completed'>('all');

  React.useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  const filtered = MOCK_CONTRACTS.filter((c) => filter === 'all' || c.status === filter);

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

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl p-5 space-y-3">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((contract) => {
              const statusConfig = STATUS_BADGE[contract.status] ?? STATUS_BADGE.draft;
              const releasedPct = contract.totalAmount > 0 ? (contract.escrowReleased / contract.totalAmount) * 100 : 0;
              return (
                <Link
                  key={contract.id}
                  href={`/company/contracts/${contract.id}`}
                  className="block bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl p-5 hover:border-[rgba(123,94,167,0.3)] hover:-translate-y-0.5 transition-all duration-200"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center font-display font-bold text-bg-base text-xs shrink-0" style={{ background: contract.color }} aria-hidden="true">
                        {contract.initials}
                      </div>
                      <div>
                        <p className="font-display font-semibold text-text-primary text-sm">{contract.title}</p>
                        <p className="text-xs text-text-muted">{contract.engineerName}</p>
                      </div>
                    </div>
                    <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-6 text-xs text-text-muted mb-3">
                    <span>Value: <span className="text-text-secondary font-mono font-semibold">₹{contract.totalAmount.toLocaleString('en-IN')}</span></span>
                    <span className="capitalize">{contract.mode.replace('_', ' ')}</span>
                  </div>
                  {contract.mode !== 'full_time' && (
                    <div className="h-1.5 bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden">
                      <div className="h-full bg-accent-green rounded-full" style={{ width: `${releasedPct}%` }} />
                    </div>
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
