'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MOCK_CONTRACT,
  getMilestoneStatusColor,
  formatCountdown72h,
  type MilestoneStatus,
} from '@/lib/hiring-data';

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

export default function CompanyContractTrackerPage({ params }: { params: { id: string } }) {
  const contract = MOCK_CONTRACT;
  const [showDispute, setShowDispute] = React.useState(false);
  const [countdown, setCountdown] = React.useState<Record<string, string>>({});
  const [approvingMilestone, setApprovingMilestone] = React.useState<string | null>(null);

  // Live countdown for submitted milestones
  React.useEffect(() => {
    const submitted = contract.milestones.filter((m) => m.status === 'submitted' && m.autoApproveAt);
    if (!submitted.length) return;
    const update = () => {
      const next: Record<string, string> = {};
      submitted.forEach((m) => { if (m.autoApproveAt) next[m.id] = formatCountdown72h(m.submittedAt!); });
      setCountdown(next);
    };
    update();
    const t = setInterval(update, 60000);
    return () => clearInterval(t);
  }, [contract.milestones]);

  async function handleApproveMilestone(milestoneId: string) {
    setApprovingMilestone(milestoneId);
    await new Promise((r) => setTimeout(r, 1500));
    setApprovingMilestone(null);
    // In real app: update milestone status to 'approved' and trigger payment
  }

  const totalEscrowed = contract.totalAmount;
  const released = contract.escrowReleased;
  const remaining = totalEscrowed - released;
  const releasedPct = (released / totalEscrowed) * 100;

  const statusConfig = STATUS_BADGE[contract.status];

  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 space-y-8">

        {/* Header */}
        <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                <Badge variant="gray">{contract.mode.replace('_', ' ')}</Badge>
              </div>
              <h1 className="font-display font-bold text-xl text-text-primary">{contract.title}</h1>
            </div>
          </div>

          {/* Parties */}
          <div className="flex items-center gap-6 mb-5">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full flex items-center justify-center font-display font-bold text-bg-base text-xs" style={{ background: contract.companyColor }} aria-hidden="true">{contract.companyInitials}</div>
              <div><p className="text-sm font-medium text-text-primary">{contract.companyName}</p><p className="text-xs text-text-muted">Company</p></div>
            </div>
            <div className="flex-1 h-px bg-[rgba(255,255,255,0.06)]" aria-hidden="true" />
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full flex items-center justify-center font-display font-bold text-bg-base text-xs" style={{ background: contract.engineerColor }} aria-hidden="true">{contract.engineerInitials}</div>
              <div><p className="text-sm font-medium text-text-primary">{contract.engineerName}</p><p className="text-xs text-text-muted">Engineer</p></div>
            </div>
          </div>

          {/* Financial breakdown */}
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { label: 'Total Value',       value: `₹${contract.totalAmount.toLocaleString('en-IN')}`,      color: '#F59E0B' },
              { label: 'Platform Fee',      value: `₹${contract.platformFee.toLocaleString('en-IN')}`,      color: '#4A5568' },
              { label: 'Engineer Take-home',value: `₹${contract.engineerTakeHome.toLocaleString('en-IN')}`, color: '#10B981' },
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
        <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
          <h2 className="font-display font-semibold text-text-primary mb-6">Milestones</h2>
          <div className="relative space-y-0">
            <div className="absolute left-[11px] top-3 bottom-3 w-px bg-[rgba(255,255,255,0.06)]" aria-hidden="true" />
            {contract.milestones.map((m, i) => {
              const color = getMilestoneStatusColor(m.status);
              return (
                <div key={m.id} className="relative flex gap-5 pb-8 last:pb-0">
                  {/* Timeline dot */}
                  <div className="relative z-10 shrink-0 mt-1">
                    <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center" style={{ borderColor: color, background: `${color}20` }}>
                      {m.status === 'paid' ? (
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true"><path d="M1 4L3.5 6.5L9 1" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      ) : (
                        <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 bg-bg-elevated border rounded-xl p-4" style={{ borderColor: `${color}20` }}>
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                      <div>
                        <p className="font-display font-semibold text-text-primary text-sm">{m.title}</p>
                        <p className="text-xs text-text-muted font-mono mt-0.5">Due: {m.dueDate}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-bold text-lg" style={{ color }}>₹{m.amount.toLocaleString('en-IN')}</p>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full" style={{ background: `${color}15`, color }}>
                          {MILESTONE_STATUS_LABEL[m.status]}
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
                            loading={approvingMilestone === m.id}
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
              { name: 'Signed Contract.pdf', icon: '📄', available: contract.companySigned && contract.engineerSigned },
              { name: 'NDA Agreement.pdf',   icon: '🔒', available: contract.ndaRequired },
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
            <div>
              <label className="block text-xs text-text-muted mb-1.5">Evidence (optional)</label>
              <input type="file" multiple className="w-full text-xs text-text-secondary file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-bg-elevated file:text-accent-cyan hover:file:bg-[rgba(0,212,255,0.05)] file:cursor-pointer" />
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
