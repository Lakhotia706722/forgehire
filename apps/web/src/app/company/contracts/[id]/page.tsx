'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { type MilestoneStatus } from '@/lib/hiring-data';
import { avatarToneClass, initialsFromName } from '@/lib/avatar-tone';
import { Progress } from '@/components/ui/progress';
import {
  useContractDetail,
  useApproveContractMilestone,
  useRaiseContractDispute,
} from '@/lib/api-hooks';
import { Skeleton } from '@/components/ui/skeleton';
import { apiFetch } from '@/lib/api-fetch';
import { toast } from 'sonner';

function formatCountdown72h(submittedAt: string): string {
  const deadline = new Date(new Date(submittedAt).getTime() + 72 * 60 * 60 * 1000);
  const diff = deadline.getTime() - Date.now();
  if (diff <= 0) return 'Auto-approving...';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return `${h}h ${m}m`;
}

const STATUS_BADGE: Record<string, { variant: 'cyan' | 'green' | 'amber' | 'red' | 'gray'; label: string }> = {
  draft:             { variant: 'gray',  label: 'Draft' },
  pending_signature: { variant: 'amber', label: 'Pending Signature' },
  active:            { variant: 'cyan',  label: 'Active' },
  completed:         { variant: 'green', label: 'Completed' },
  terminated:        { variant: 'red',   label: 'Terminated' },
  disputed:          { variant: 'red',   label: 'Disputed' },
};

const MILESTONE_STATUS_LABEL: Record<MilestoneStatus, string> = {
  upcoming:    'Upcoming',
  in_progress: 'In Progress',
  submitted:   'Submitted',
  approved:    'Approved',
  paid:        'Paid',
};

const MILESTONE_UI: Record<
  MilestoneStatus,
  { border: string; dotBorder: string; dotBg: string; amount: string; badge: string }
> = {
  upcoming: {
    border: 'border-[rgba(74,85,104,0.2)]',
    dotBorder: 'border-[#4A5568]',
    dotBg: 'bg-[#4A5568]',
    amount: 'text-[#4A5568]',
    badge: 'bg-[rgba(74,85,104,0.15)] text-[#4A5568]',
  },
  in_progress: {
    border: 'border-[rgba(0,212,255,0.2)]',
    dotBorder: 'border-accent-cyan',
    dotBg: 'bg-accent-cyan',
    amount: 'text-accent-cyan',
    badge: 'bg-[rgba(0,212,255,0.15)] text-accent-cyan',
  },
  submitted: {
    border: 'border-[rgba(245,158,11,0.2)]',
    dotBorder: 'border-accent-amber',
    dotBg: 'bg-accent-amber',
    amount: 'text-accent-amber',
    badge: 'bg-[rgba(245,158,11,0.15)] text-accent-amber',
  },
  approved: {
    border: 'border-[rgba(16,185,129,0.2)]',
    dotBorder: 'border-accent-green',
    dotBg: 'bg-accent-green',
    amount: 'text-accent-green',
    badge: 'bg-[rgba(16,185,129,0.15)] text-accent-green',
  },
  paid: {
    border: 'border-[rgba(16,185,129,0.2)]',
    dotBorder: 'border-accent-green',
    dotBg: 'bg-accent-green',
    amount: 'text-accent-green',
    badge: 'bg-[rgba(16,185,129,0.15)] text-accent-green',
  },
};

export default function CompanyContractTrackerPage({ params }: { params: { id: string } }) {
  const { data: contract, isLoading, error, refetch } = useContractDetail(params.id);
  const approveMilestone = useApproveContractMilestone(params.id);
  const raiseDispute = useRaiseContractDispute(params.id);
  const [showDispute, setShowDispute] = React.useState(false);
  const [showAmendment, setShowAmendment] = React.useState(false);
  const [countdown, setCountdown] = React.useState<Record<string, string>>({});
  const [disputeReason, setDisputeReason] = React.useState('Deliverables not meeting requirements');
  const [disputeDescription, setDisputeDescription] = React.useState('');
  const [amendmentReason, setAmendmentReason] = React.useState('');
  const [amendmentChanges, setAmendmentChanges] = React.useState('');
  const [requestingAmendment, setRequestingAmendment] = React.useState(false);

  const submittedMilestoneIds = contract?.milestones
    .filter((m) => m.status === 'submitted' && m.submittedAt)
    .map((m) => m.id)
    .join(',') ?? '';

  React.useEffect(() => {
    if (!contract?.milestones || !submittedMilestoneIds) return;
    const submitted = contract.milestones.filter((m) => m.status === 'submitted' && m.submittedAt);
    if (!submitted.length) return;
    const update = () => {
      const next: Record<string, string> = {};
      submitted.forEach((m) => {
        if (m.submittedAt) next[m.id] = formatCountdown72h(m.submittedAt);
      });
      setCountdown(next);
    };
    update();
    const t = setInterval(update, 60000);
    return () => clearInterval(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submittedMilestoneIds]);

  async function handleApproveMilestone(milestoneId: string) {
    try {
      await approveMilestone.mutateAsync(milestoneId);
      toast.success('Milestone approved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to approve milestone');
    }
  }

  async function handleSubmitDispute() {
    if (disputeDescription.trim().length < 10) {
      toast.error('Dispute description must be at least 10 characters');
      return;
    }
    try {
      await raiseDispute.mutateAsync({
        reason: `${disputeReason}: ${disputeDescription.trim()}`,
      });
      setShowDispute(false);
      setDisputeDescription('');
      toast.success('Dispute submitted');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit dispute');
    }
  }

  async function handleRequestAmendment() {
    if (amendmentReason.trim().length < 5 || amendmentChanges.trim().length < 10) {
      toast.error('Please add reason and scope changes');
      return;
    }
    setRequestingAmendment(true);
    try {
      await apiFetch(`/api/contracts/${params.id}/amendment`, {
        method: 'POST',
        body: JSON.stringify({
          reason: amendmentReason.trim(),
          changes: { scope: amendmentChanges.trim() },
        }),
      });
      setShowAmendment(false);
      setAmendmentReason('');
      setAmendmentChanges('');
      toast.success('Scope change requested');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to request scope change');
    } finally {
      setRequestingAmendment(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-base p-8 max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-60 rounded-2xl" />
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-muted">Failed to load contract</p>
          <Button className="mt-3" size="sm" variant="secondary" onClick={() => { void refetch(); }}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const totalEscrowed = contract.totalAmount || 0;
  const released = contract.milestones
    .filter((m) => m.status === 'paid')
    .reduce((sum, m) => sum + m.amount, 0);
  const remaining = totalEscrowed - released;
  const releasedPct = totalEscrowed > 0 ? (released / totalEscrowed) * 100 : 0;
  const platformFee = Math.round(totalEscrowed * 0.1);
  const engineerTakeHome = totalEscrowed - platformFee;

  const statusConfig = STATUS_BADGE[contract.status] ?? { variant: 'gray' as const, label: contract.status };

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
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => setShowAmendment(true)}>
                Request Scope Change
              </Button>
            </div>
          </div>

          {/* Parties */}
          <div className="flex items-center gap-6 mb-5">
            <div className="flex items-center gap-2">
              <div className={cn('w-9 h-9 rounded-full flex items-center justify-center font-display font-bold text-bg-base text-xs', avatarToneClass(contract.companyName))} aria-hidden="true">{initialsFromName(contract.companyName)}</div>
              <div><p className="text-sm font-medium text-text-primary">{contract.companyName}</p><p className="text-xs text-text-muted">Company</p></div>
            </div>
            <div className="flex-1 h-px bg-[rgba(255,255,255,0.06)]" aria-hidden="true" />
            <div className="flex items-center gap-2">
              <div className={cn('w-9 h-9 rounded-full flex items-center justify-center font-display font-bold text-bg-base text-xs', avatarToneClass(contract.engineerName))} aria-hidden="true">{initialsFromName(contract.engineerName)}</div>
              <div><p className="text-sm font-medium text-text-primary">{contract.engineerName}</p><p className="text-xs text-text-muted">Engineer</p></div>
            </div>
          </div>

          {/* Financial breakdown */}
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { label: 'Total Value',       value: `₹${contract.totalAmount.toLocaleString('en-IN')}`,      valueClass: 'text-accent-amber' },
              { label: 'Platform Fee',      value: `₹${platformFee.toLocaleString('en-IN')}`,      valueClass: 'text-text-muted' },
              { label: 'Engineer Take-home',value: `₹${engineerTakeHome.toLocaleString('en-IN')}`, valueClass: 'text-accent-green' },
            ].map((item) => (
              <div key={item.label} className="bg-bg-elevated rounded-xl p-3">
                <p className={cn('font-mono font-bold text-lg', item.valueClass)}>{item.value}</p>
                <p className="text-xs text-text-muted mt-0.5">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Escrow bar */}
        <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-5">
          <h2 className="font-display font-semibold text-text-primary mb-4">Escrow Status</h2>
          <Progress
            value={released}
            max={totalEscrowed || 1}
            color="green"
            size="lg"
            label={`₹${released.toLocaleString('en-IN')} released of ₹${totalEscrowed.toLocaleString('en-IN')}`}
            className="mb-3"
          />
          <div className="flex justify-between text-xs font-mono text-text-muted">
            <span className="text-accent-green">Released: ₹{released.toLocaleString('en-IN')}</span>
            <span>Remaining: ₹{remaining.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Milestone timeline */}
        <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
          <h2 className="font-display font-semibold text-text-primary mb-6">Milestones</h2>
          <div className="relative space-y-0">
            <div className="absolute left-[11px] top-3 bottom-3 w-px bg-[rgba(255,255,255,0.06)]" aria-hidden="true" />
            {contract.milestones.map((m) => {
              const ui = MILESTONE_UI[m.status as MilestoneStatus] ?? MILESTONE_UI.upcoming;
              return (
                <div key={m.id} className="relative flex gap-5 pb-8 last:pb-0">
                  {/* Timeline dot */}
                  <div className="relative z-10 shrink-0 mt-1">
                    <div className={cn('w-6 h-6 rounded-full border-2 flex items-center justify-center bg-bg-elevated', ui.dotBorder)}>
                      {m.status === 'paid' ? (
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none" className={ui.amount} aria-hidden="true"><path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      ) : (
                        <div className={cn('w-2 h-2 rounded-full', ui.dotBg)} />
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className={cn('flex-1 bg-bg-elevated border rounded-xl p-4', ui.border)}>
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                      <div>
                        <p className="font-display font-semibold text-text-primary text-sm">{m.title}</p>
                        <p className="text-xs text-text-muted font-mono mt-0.5">Due: {m.dueDate ? new Date(m.dueDate).toLocaleDateString('en-IN') : '—'}</p>
                      </div>
                      <div className="text-right">
                        <p className={cn('font-mono font-bold text-lg', ui.amount)}>₹{m.amount.toLocaleString('en-IN')}</p>
                        <span className={cn('text-[10px] font-mono px-2 py-0.5 rounded-full', ui.badge)}>
                          {MILESTONE_STATUS_LABEL[m.status as MilestoneStatus] ?? m.status}
                        </span>
                      </div>
                    </div>

                    {/* Submitted milestone — company actions */}
                    {m.status === 'submitted' && (
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center gap-2 text-xs text-text-muted">
                          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2"/></svg>
                          Auto-approves in <span className="font-mono text-accent-amber ml-1" data-testid={`countdown-${m.id}`}>{countdown[m.id] ?? '...'}</span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="flex-1 h-8 text-xs"
                            loading={approveMilestone.isPending}
                            onClick={() => handleApproveMilestone(m.id)}
                            data-testid={`approve-btn-${m.id}`}
                          >
                            Approve & Release ₹{m.amount.toLocaleString('en-IN')}
                          </Button>
                          <Button variant="danger" size="sm" className="h-8 text-xs" onClick={() => setShowDispute(true)} data-testid={`dispute-btn-${m.id}`}>
                            Raise Dispute
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Paid */}
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

        {/* Document vault */}
        <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-5">
          <h2 className="font-display font-semibold text-text-primary mb-4">Document Vault</h2>
          <div className="space-y-2">
            {[
              { name: 'Signed Contract.pdf', icon: '📄', available: !!contract.finalContractUrl },
              { name: 'NDA Agreement.pdf',   icon: '🔒', available: false },
            ].map((doc) => (
              <div key={doc.name} className="flex items-center justify-between p-3 bg-bg-elevated rounded-xl border border-[rgba(255,255,255,0.06)]">
                <div className="flex items-center gap-2">
                  <span aria-hidden="true">{doc.icon}</span>
                  <span className="text-sm text-text-secondary">{doc.name}</span>
                </div>
                {doc.available ? (
                  <button className="text-xs text-accent-cyan hover:underline">Download</button>
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
              <select
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                className="w-full bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-[rgba(0,212,255,0.3)] [color-scheme:dark]"
                aria-label="Dispute reason"
              >
                {[
                  'Deliverables not meeting requirements',
                  'Incomplete work submitted',
                  'Quality below agreed standard',
                  'Other',
                ].map((value) => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1.5">Description</label>
              <textarea
                id="dispute-description"
                rows={3}
                value={disputeDescription}
                onChange={(e) => setDisputeDescription(e.target.value)}
                placeholder="Describe the issue in detail..."
                aria-label="Dispute description"
                className="w-full bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,212,255,0.3)] resize-none"
              />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1.5">Evidence (optional)</label>
              <input
                type="file"
                multiple
                aria-label="Upload dispute evidence files"
                className="w-full text-xs text-text-secondary file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-bg-elevated file:text-accent-cyan hover:file:bg-[rgba(0,212,255,0.05)] file:cursor-pointer"
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="danger"
                size="md"
                className="flex-1"
                loading={raiseDispute.isPending}
                onClick={() => { void handleSubmitDispute(); }}
              >
                Submit Dispute
              </Button>
              <Button variant="ghost" size="md" onClick={() => setShowDispute(false)}>Cancel</Button>
            </div>
          </div>
        )}

        {showAmendment && (
          <div className="bg-bg-surface border border-[rgba(255,255,255,0.08)] rounded-2xl p-5 space-y-4">
            <h2 className="font-display font-semibold text-text-primary">Request Scope Change</h2>
            <div>
              <label className="block text-xs text-text-muted mb-1.5">Reason</label>
              <input
                value={amendmentReason}
                onChange={(e) => setAmendmentReason(e.target.value)}
                placeholder="Why is the change needed?"
                className="w-full bg-bg-elevated border border-[rgba(255,255,255,0.06)] rounded-lg px-3 py-2.5 text-sm text-text-primary"
              />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1.5">Requested Changes</label>
              <textarea
                rows={4}
                value={amendmentChanges}
                onChange={(e) => setAmendmentChanges(e.target.value)}
                placeholder="Describe milestone/scope changes..."
                className="w-full bg-bg-elevated border border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-3 text-sm text-text-primary resize-none"
              />
            </div>
            <div className="flex gap-3">
              <Button
                size="md"
                className="flex-1"
                loading={requestingAmendment}
                onClick={() => { void handleRequestAmendment(); }}
              >
                Submit Amendment Request
              </Button>
              <Button variant="ghost" size="md" onClick={() => setShowAmendment(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
