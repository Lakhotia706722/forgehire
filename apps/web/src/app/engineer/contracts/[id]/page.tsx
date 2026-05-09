'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useContractDetail } from '@/lib/api-hooks';

const STATUS_BADGE: Record<string, { variant: 'cyan' | 'green' | 'amber' | 'red' | 'gray'; label: string }> = {
  draft:             { variant: 'gray',  label: 'Draft' },
  pending_signature: { variant: 'amber', label: 'Pending Signature' },
  active:            { variant: 'cyan',  label: 'Active' },
  completed:         { variant: 'green', label: 'Completed' },
  terminated:        { variant: 'red',   label: 'Terminated' },
  disputed:          { variant: 'red',   label: 'Disputed' },
};

const MILESTONE_STATUS_LABEL: Record<string, string> = {
  pending:     'Upcoming',
  in_progress: 'In Progress',
  submitted:   'Submitted',
  approved:    'Approved',
  paid:        'Paid',
};

const MILESTONE_COLORS: Record<string, string> = {
  pending:     '#8892A4',
  in_progress: '#00D4FF',
  submitted:   '#F59E0B',
  approved:    '#7B5EA7',
  paid:        '#10B981',
};

function formatCountdown72h(submittedAt: string): string {
  const deadline = new Date(new Date(submittedAt).getTime() + 72 * 60 * 60 * 1000);
  const diff = deadline.getTime() - Date.now();
  if (diff <= 0) return 'Auto-approving...';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return `${h}h ${m}m`;
}

const COLORS = ['#00D4FF', '#F59E0B', '#7B5EA7', '#10B981'];
function colorFromName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}
function initialsFromName(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function ContractTrackerPage({ params }: { params: { id: string } }) {
  const { data: contract, isLoading, error } = useContractDetail(params.id);
  const [showDispute, setShowDispute] = React.useState(false);
  const [countdown, setCountdown] = React.useState<Record<string, string>>({});

  // Live countdown for submitted milestones — stable dependency to avoid infinite loop
  const submittedMilestoneIds = contract?.milestones
    .filter(m => m.status === 'submitted' && m.submittedAt)
    .map(m => m.id)
    .join(',') ?? '';

  React.useEffect(() => {
    if (!contract?.milestones || !submittedMilestoneIds) return;
    const submitted = contract.milestones.filter(m => m.status === 'submitted' && m.submittedAt);
    if (!submitted.length) return;
    const update = () => {
      const next: Record<string, string> = {};
      submitted.forEach(m => { if (m.submittedAt) next[m.id] = formatCountdown72h(m.submittedAt); });
      setCountdown(next);
    };
    update();
    const t = setInterval(update, 60000);
    return () => clearInterval(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submittedMilestoneIds]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-base">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 space-y-6">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-60 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-muted">Failed to load contract</p>
        </div>
      </div>
    );
  }

  const totalEscrowed = contract.totalAmount || 0;
  const released = contract.milestones
    .filter(m => m.status === 'paid')
    .reduce((sum, m) => sum + m.amount, 0);
  const remaining = totalEscrowed - released;
  const releasedPct = totalEscrowed > 0 ? (released / totalEscrowed) * 100 : 0;
  const platformFee = Math.round(totalEscrowed * 0.1);
  const engineerTakeHome = totalEscrowed - platformFee;

  const statusConfig = STATUS_BADGE[contract.status] ?? { variant: 'gray' as const, label: contract.status };
  const companyColor = colorFromName(contract.companyName);
  const engineerColor = colorFromName(contract.engineerName);

  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 space-y-8">

        {/* Header */}
        <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                <Badge variant="gray">{contract.hiringMode.replace('_', ' ')}</Badge>
              </div>
              <h1 className="font-display font-bold text-xl text-text-primary">{contract.title}</h1>
            </div>
          </div>

          {/* Parties */}
          <div className="flex items-center gap-6 mb-5">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full flex items-center justify-center font-display font-bold text-bg-base text-xs" style={{ background: companyColor }} aria-hidden="true">
                {initialsFromName(contract.companyName)}
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">{contract.companyName}</p>
                <p className="text-xs text-text-muted">Company</p>
              </div>
            </div>
            <div className="flex-1 h-px bg-[rgba(255,255,255,0.06)]" aria-hidden="true" />
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full flex items-center justify-center font-display font-bold text-bg-base text-xs" style={{ background: engineerColor }} aria-hidden="true">
                {initialsFromName(contract.engineerName)}
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">{contract.engineerName}</p>
                <p className="text-xs text-text-muted">Engineer</p>
              </div>
            </div>
          </div>

          {/* Financial breakdown */}
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { label: 'Total Value',        value: `₹${totalEscrowed.toLocaleString('en-IN')}`,  color: '#F59E0B' },
              { label: 'Platform Fee (10%)', value: `₹${platformFee.toLocaleString('en-IN')}`,    color: '#4A5568' },
              { label: 'Engineer Take-home', value: `₹${engineerTakeHome.toLocaleString('en-IN')}`, color: '#10B981' },
            ].map((item) => (
              <div key={item.label} className="bg-bg-elevated rounded-xl p-3">
                <p className="font-mono font-bold text-lg" style={{ color: item.color }}>{item.value}</p>
                <p className="text-xs text-text-muted mt-0.5">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Escrow bar */}
        <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-5">
          <h2 className="font-display font-semibold text-text-primary mb-4">Escrow Status</h2>
          <div className="h-3 bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-accent-green rounded-full transition-all duration-700"
              style={{ width: `${releasedPct}%` }}
              role="progressbar"
              aria-valuenow={released}
              aria-valuemin={0}
              aria-valuemax={totalEscrowed}
              aria-label={`₹${released.toLocaleString('en-IN')} released of ₹${totalEscrowed.toLocaleString('en-IN')}`}
            />
          </div>
          <div className="flex justify-between text-xs font-mono text-text-muted">
            <span className="text-accent-green">Released: ₹{released.toLocaleString('en-IN')}</span>
            <span>Remaining: ₹{remaining.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Milestone timeline */}
        {contract.milestones.length > 0 && (
          <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
            <h2 className="font-display font-semibold text-text-primary mb-6">Milestones</h2>
            <div className="relative space-y-0">
              <div className="absolute left-[11px] top-3 bottom-3 w-px bg-[rgba(255,255,255,0.06)]" aria-hidden="true" />
              {contract.milestones.map((m) => {
                const color = MILESTONE_COLORS[m.status] ?? '#8892A4';
                return (
                  <div key={m.id} className="relative flex gap-5 pb-8 last:pb-0">
                    <div className="relative z-10 shrink-0 mt-1">
                      <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center" style={{ borderColor: color, background: `${color}20` }}>
                        {m.status === 'paid' ? (
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true"><path d="M1 4L3.5 6.5L9 1" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        ) : (
                          <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                        )}
                      </div>
                    </div>
                    <div className="flex-1 bg-bg-elevated border rounded-xl p-4" style={{ borderColor: `${color}20` }}>
                      <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                        <div>
                          <p className="font-display font-semibold text-text-primary text-sm">{m.title}</p>
                          {m.dueDate && (
                            <p className="text-xs text-text-muted font-mono mt-0.5">
                              Due: {new Date(m.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-mono font-bold text-lg" style={{ color }}>₹{m.amount.toLocaleString('en-IN')}</p>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full" style={{ background: `${color}15`, color }}>
                            {MILESTONE_STATUS_LABEL[m.status] ?? m.status}
                          </span>
                        </div>
                      </div>

                      {m.status === 'submitted' && (
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center gap-2 text-xs text-text-muted">
                            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2"/></svg>
                            Auto-approves in <span className="font-mono text-accent-amber ml-1" data-testid={`countdown-${m.id}`}>{countdown[m.id] ?? '...'}</span>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" className="flex-1 h-8 text-xs" data-testid={`approve-btn-${m.id}`}>
                              Approve &amp; Release ₹{m.amount.toLocaleString('en-IN')}
                            </Button>
                            <Button variant="danger" size="sm" className="h-8 text-xs" onClick={() => setShowDispute(true)} data-testid={`dispute-btn-${m.id}`}>
                              Raise Dispute
                            </Button>
                          </div>
                        </div>
                      )}

                      {m.status === 'in_progress' && (
                        <Button size="sm" className="mt-3 h-8 text-xs" data-testid={`submit-btn-${m.id}`}>
                          Submit Deliverables
                        </Button>
                      )}

                      {m.status === 'paid' && (
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-accent-green">
                          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 8l4 4 8-8"/></svg>
                          ₹{m.amount.toLocaleString('en-IN')} released to engineer
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Document vault */}
        <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-5">
          <h2 className="font-display font-semibold text-text-primary mb-4">Document Vault</h2>
          <div className="space-y-2">
            {[
              { name: 'Signed Contract.pdf', icon: '📄', url: contract.finalContractUrl },
            ].map((doc) => (
              <div key={doc.name} className="flex items-center justify-between p-3 bg-bg-elevated rounded-xl border border-[rgba(255,255,255,0.06)]">
                <div className="flex items-center gap-2">
                  <span aria-hidden="true">{doc.icon}</span>
                  <span className="text-sm text-text-secondary">{doc.name}</span>
                </div>
                {doc.url ? (
                  <a href={doc.url} download className="text-xs text-accent-cyan hover:underline">Download</a>
                ) : (
                  <span className="text-xs text-text-muted">Not available</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Dispute section */}
        {showDispute && (
          <div className="bg-[rgba(239,68,68,0.06)] border border-[rgba(239,68,68,0.2)] rounded-2xl p-5 space-y-4">
            <h2 className="font-display font-semibold text-accent-red">Raise Dispute</h2>
            <div>
              <label className="block text-xs text-text-muted mb-1.5">Reason</label>
              <select className="w-full bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-[rgba(0,212,255,0.3)] [color-scheme:dark]" aria-label="Dispute reason">
                <option>Deliverables not meeting requirements</option>
                <option>Incomplete work submitted</option>
                <option>Quality below agreed standard</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1.5">Description</label>
              <textarea rows={3} placeholder="Describe the issue in detail..." className="w-full bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,212,255,0.3)] resize-none" />
            </div>
            <div className="flex gap-3">
              <Button variant="danger" size="md" className="flex-1">Submit Dispute</Button>
              <Button variant="ghost" size="md" onClick={() => setShowDispute(false)}>Cancel</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
