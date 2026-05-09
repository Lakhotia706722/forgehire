'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import type { HiringMode } from '@/lib/hiring-data';

interface HireModalProps {
  open: boolean;
  onClose: () => void;
  engineerName: string;
  engineerHourlyRate: number;
}

type HireStep = 'mode' | 'scope' | 'contract' | 'signing' | 'escrow' | 'success';

interface Milestone {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  amount: string;
}

const HIRING_MODES: { mode: HiringMode; label: string; icon: string; desc: string; bestFor: string; pricing: string }[] = [
  { mode: 'full_time',  label: 'Full-Time',   icon: '💼', desc: 'Permanent employment',          bestFor: 'Long-term team member',    pricing: 'Annual CTC' },
  { mode: 'internship', label: 'Internship',  icon: '🎓', desc: '1–6 month learning engagement', bestFor: 'Fresh talent, short projects', pricing: 'Monthly stipend' },
  { mode: 'hourly',     label: 'Hourly',      icon: '⏱',  desc: 'Pay per hour worked',           bestFor: 'Ongoing flexible work',    pricing: 'Per hour' },
  { mode: 'project',    label: 'Project',     icon: '🎯', desc: 'Fixed scope, fixed price',       bestFor: 'Defined deliverables',     pricing: 'Milestone-based' },
];

export function HireModal({ open, onClose, engineerName, engineerHourlyRate }: HireModalProps) {
  const [step, setStep] = React.useState<HireStep>('mode');
  const [mode, setMode] = React.useState<HiringMode | null>(null);
  const [scope, setScope] = React.useState('');
  const [milestones, setMilestones] = React.useState<Milestone[]>([
    { id: '1', title: '', description: '', dueDate: '', amount: '' },
  ]);
  const [totalBudget, setTotalBudget] = React.useState('');
  const [ipOwnership, setIpOwnership] = React.useState<'company' | 'engineer' | 'shared'>('company');
  const [ndaChecked, setNdaChecked] = React.useState(false);
  const [companySigned, setCompanySigned] = React.useState(false);
  const [engineerSigned, setEngineerSigned] = React.useState(false);
  const [typedSig, setTypedSig] = React.useState('');
  const [processing, setProcessing] = React.useState(false);

  const milestonesTotal = milestones.reduce((s, m) => s + (parseFloat(m.amount) || 0), 0);
  const budget = parseFloat(totalBudget) || 0;
  const milestoneMismatch = mode === 'project' && budget > 0 && Math.abs(milestonesTotal - budget) > 1;

  function addMilestone() {
    setMilestones((prev) => [...prev, { id: crypto.randomUUID(), title: '', description: '', dueDate: '', amount: '' }]);
  }

  function updateMilestone(id: string, field: keyof Milestone, val: string) {
    setMilestones((prev) => prev.map((m) => m.id === id ? { ...m, [field]: val } : m));
  }

  function removeMilestone(id: string) {
    setMilestones((prev) => prev.filter((m) => m.id !== id));
  }

  function handleCompanySign() {
    if (!typedSig.trim()) return;
    setCompanySigned(true);
    // Simulate engineer signing after 2s
    setTimeout(() => setEngineerSigned(true), 2000);
  }

  async function handleEscrowPay() {
    setProcessing(true);
    await new Promise((r) => setTimeout(r, 1500));
    setProcessing(false);
    setStep('success');
  }

  const STEPS: HireStep[] = ['mode', 'scope', 'contract', 'signing', 'escrow'];
  const stepIndex = STEPS.indexOf(step);

  return (
    <Modal
      open={open}
      onClose={step === 'signing' ? undefined : onClose}
      title={step === 'success' ? undefined : `Hire ${engineerName}`}
      size="lg"
    >
      {step !== 'success' && (
        <div className="flex items-center gap-1 px-6 pt-2 pb-0">
          {STEPS.map((s, i) => (
            <React.Fragment key={s}>
              <div className={cn('w-2 h-2 rounded-full transition-all', i <= stepIndex ? 'bg-accent-cyan' : 'bg-[rgba(255,255,255,0.1)]')} />
              {i < STEPS.length - 1 && <div className={cn('flex-1 h-px transition-all', i < stepIndex ? 'bg-accent-cyan' : 'bg-[rgba(255,255,255,0.1)]')} />}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Step 1 — Mode */}
      {step === 'mode' && (
        <div className="p-6 space-y-5">
          <p className="text-sm text-text-secondary">How do you want to engage with {engineerName}?</p>
          <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Hiring mode">
            {HIRING_MODES.map((hm) => (
              <button
                key={hm.mode}
                type="button"
                role="radio"
                aria-checked={mode === hm.mode}
                onClick={() => setMode(hm.mode)}
                className={cn(
                  'text-left p-4 rounded-xl border-2 transition-all duration-150 hover:-translate-y-0.5',
                  mode === hm.mode
                    ? 'border-[rgba(0,212,255,0.5)] bg-[rgba(0,212,255,0.06)]'
                    : 'border-[rgba(255,255,255,0.06)] bg-bg-surface hover:border-[rgba(255,255,255,0.15)]'
                )}
              >
                <span className="text-2xl block mb-2" aria-hidden="true">{hm.icon}</span>
                <p className="text-sm font-semibold text-text-primary">{hm.label}</p>
                <p className="text-xs text-text-muted mt-0.5">{hm.desc}</p>
                <p className="text-[10px] text-accent-cyan mt-1.5 font-mono">{hm.pricing}</p>
              </button>
            ))}
          </div>
          <div className="flex justify-end">
            <Button size="md" disabled={!mode} onClick={() => setStep('scope')}>
              Continue →
            </Button>
          </div>
        </div>
      )}

      {/* Step 2 — Scope */}
      {step === 'scope' && (
        <div className="p-6 space-y-5">
          <p className="text-sm text-text-secondary">Define the scope of work.</p>

          {mode === 'project' && (
            <>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Project Scope *</label>
                <RichTextEditor value={scope} onChange={setScope} placeholder="Describe the project scope, deliverables, and success criteria..." minHeight={120} />
              </div>

              {/* Milestones */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-text-secondary">Milestones</label>
                  {milestoneMismatch && (
                    <span className="text-xs text-accent-amber font-mono" data-testid="milestone-mismatch-warning">
                      ⚠ Total ₹{milestonesTotal.toLocaleString('en-IN')} ≠ Budget ₹{budget.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
                <div className="space-y-3">
                  {milestones.map((m, i) => (
                    <div key={m.id} className="bg-bg-elevated border border-[rgba(255,255,255,0.06)] rounded-xl p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-text-muted">Milestone {i + 1}</span>
                        {milestones.length > 1 && (
                          <button onClick={() => removeMilestone(m.id)} className="text-text-muted hover:text-accent-red transition-colors text-xs" aria-label="Remove milestone">Remove</button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input value={m.title} onChange={(e) => updateMilestone(m.id, 'title', e.target.value)} placeholder="Milestone title" className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,212,255,0.3)]" />
                        <input type="date" value={m.dueDate} onChange={(e) => updateMilestone(m.id, 'dueDate', e.target.value)} className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-[rgba(0,212,255,0.3)] [color-scheme:dark]" aria-label="Due date" />
                      </div>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted font-mono text-sm pointer-events-none">₹</span>
                        <input type="number" value={m.amount} onChange={(e) => updateMilestone(m.id, 'amount', e.target.value)} placeholder="Amount" className="w-full bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-lg pl-8 pr-3 py-2 text-sm text-text-primary font-mono placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,212,255,0.3)]" aria-label="Milestone amount" />
                      </div>
                    </div>
                  ))}
                  <button onClick={addMilestone} className="text-xs text-accent-cyan hover:underline">+ Add milestone</button>
                </div>
              </div>

              {/* Total budget */}
              <div className="relative">
                <label className="block text-sm font-medium text-text-secondary mb-2">Total Budget *</label>
                <span className="absolute left-3 bottom-2.5 text-text-muted font-mono pointer-events-none">₹</span>
                <input type="number" value={totalBudget} onChange={(e) => setTotalBudget(e.target.value)} placeholder="0" className="w-full bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl pl-8 pr-4 py-3 font-mono text-xl text-text-primary focus:outline-none focus:border-[rgba(0,212,255,0.3)]" aria-label="Total budget" data-testid="total-budget-input" />
              </div>
            </>
          )}

          {mode === 'hourly' && (
            <div className="space-y-4">
              <div className="p-4 bg-bg-elevated rounded-xl border border-[rgba(255,255,255,0.06)]">
                <p className="text-xs text-text-muted mb-1">Confirmed Rate</p>
                <p className="font-mono font-bold text-accent-cyan text-2xl">₹{engineerHourlyRate.toLocaleString('en-IN')}/hr</p>
              </div>
              <Input label="Estimated Hours/Week" type="number" placeholder=" " />
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs text-text-muted mb-1.5">Start Date</label><input type="date" className="w-full bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-[rgba(0,212,255,0.3)] [color-scheme:dark]" aria-label="Start date" /></div>
                <div><label className="block text-xs text-text-muted mb-1.5">End Date (optional)</label><input type="date" className="w-full bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-[rgba(0,212,255,0.3)] [color-scheme:dark]" aria-label="End date" /></div>
              </div>
            </div>
          )}

          {(mode === 'full_time' || mode === 'internship') && (
            <div className="space-y-4">
              <Input label="Role Title" placeholder=" " />
              {mode === 'full_time' && <Input label="Annual CTC (₹)" type="number" placeholder=" " />}
              {mode === 'internship' && (
                <>
                  <div><label className="block text-xs text-text-muted mb-2">Duration: <span className="text-accent-cyan font-mono">3 months</span></label><input type="range" min={1} max={6} defaultValue={3} className="w-full" aria-label="Internship duration" /></div>
                  <Input label="Monthly Stipend (₹)" type="number" placeholder=" " />
                </>
              )}
              <div><label className="block text-sm font-medium text-text-secondary mb-2">Job Description</label><textarea rows={4} placeholder="Describe the role and responsibilities..." className="w-full bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,212,255,0.3)] resize-none" /></div>
            </div>
          )}

          <div className="flex justify-between">
            <Button variant="ghost" size="md" onClick={() => setStep('mode')}>← Back</Button>
            <Button size="md" onClick={() => setStep('contract')}>Review Contract →</Button>
          </div>
        </div>
      )}

      {/* Step 3 — Contract review */}
      {step === 'contract' && (
        <div className="p-6 space-y-5">
          <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl p-5 space-y-4 max-h-64 overflow-y-auto">
            <p className="font-display font-bold text-text-primary text-base">SERVICE AGREEMENT</p>
            <div className="space-y-3 text-sm text-text-secondary">
              <div><p className="font-semibold text-text-primary text-xs uppercase tracking-wider mb-1">Parties</p><p>Company: Sarvam AI · Engineer: {engineerName}</p></div>
              <div><p className="font-semibold text-text-primary text-xs uppercase tracking-wider mb-1">Engagement Type</p><p>{HIRING_MODES.find((m) => m.mode === mode)?.label}</p></div>
              <div><p className="font-semibold text-text-primary text-xs uppercase tracking-wider mb-1">Compensation</p><p>{mode === 'project' ? `₹${budget.toLocaleString('en-IN')} total (milestone-based)` : `₹${engineerHourlyRate.toLocaleString('en-IN')}/hr`}</p></div>
              <div><p className="font-semibold text-text-primary text-xs uppercase tracking-wider mb-1">Platform</p><p>All payments processed through NeuronHire escrow. Platform fee: 10%.</p></div>
            </div>
          </div>

          {/* IP ownership */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">IP Ownership</label>
            <div className="flex gap-2" role="radiogroup" aria-label="IP ownership">
              {(['company', 'engineer', 'shared'] as const).map((opt) => (
                <button key={opt} type="button" role="radio" aria-checked={ipOwnership === opt}
                  onClick={() => setIpOwnership(opt)}
                  className={cn('flex-1 py-2 rounded-lg text-xs font-medium transition-all capitalize', ipOwnership === opt ? 'bg-accent-cyan text-bg-base' : 'border border-[rgba(255,255,255,0.08)] text-text-muted hover:text-text-secondary')}>
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* NDA */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div className={cn('w-5 h-5 rounded border-2 flex items-center justify-center transition-all', ndaChecked ? 'bg-accent-cyan border-accent-cyan' : 'border-[rgba(255,255,255,0.2)]')}
              onClick={() => setNdaChecked((c) => !c)} role="checkbox" aria-checked={ndaChecked} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setNdaChecked((c) => !c)}>
              {ndaChecked && <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true"><path d="M1 4L3.5 6.5L9 1" stroke="#080B14" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            </div>
            <span className="text-sm text-text-secondary">Attach NDA (auto-generated template)</span>
          </label>

          <p className="text-xs text-text-muted text-center">Both parties will sign this contract digitally.</p>

          <div className="flex justify-between">
            <Button variant="ghost" size="md" onClick={() => setStep('scope')}>← Back</Button>
            <Button size="md" onClick={() => setStep('signing')}>Proceed to Signing →</Button>
          </div>
        </div>
      )}

      {/* Step 4 — Digital signing */}
      {step === 'signing' && (
        <div className="p-6 space-y-5">
          <p className="text-sm text-text-secondary text-center">Both parties must sign to activate the contract.</p>
          <div className="grid grid-cols-2 gap-4">
            {/* Company signature */}
            <div className={cn('p-4 rounded-xl border-2 transition-all', companySigned ? 'border-[rgba(16,185,129,0.4)] bg-[rgba(16,185,129,0.06)]' : 'border-[rgba(255,255,255,0.08)]')}>
              <p className="text-xs font-medium text-text-secondary mb-3">Company Signature</p>
              {companySigned ? (
                <div className="flex flex-col items-center gap-2 py-3">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>
                  <p className="text-xs text-accent-green font-medium">Signed</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <input value={typedSig} onChange={(e) => setTypedSig(e.target.value)} placeholder="Type your name" className="w-full bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-lg px-3 py-2 text-sm text-text-primary font-display italic placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,212,255,0.3)]" aria-label="Type your signature" data-testid="company-signature-input" />
                  <Button size="sm" className="w-full" disabled={!typedSig.trim()} onClick={handleCompanySign} data-testid="company-sign-btn">
                    Sign
                  </Button>
                </div>
              )}
            </div>

            {/* Engineer signature */}
            <div className={cn('p-4 rounded-xl border-2 transition-all', engineerSigned ? 'border-[rgba(16,185,129,0.4)] bg-[rgba(16,185,129,0.06)]' : 'border-[rgba(255,255,255,0.08)]')}>
              <p className="text-xs font-medium text-text-secondary mb-3">Engineer Signature</p>
              {engineerSigned ? (
                <div className="flex flex-col items-center gap-2 py-3">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>
                  <p className="text-xs text-accent-green font-medium">Signed</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-4">
                  {companySigned ? (
                    <>
                      <div className="flex gap-1">
                        {[0,1,2].map((i) => <div key={i} className="w-1.5 h-1.5 rounded-full bg-accent-cyan animate-bounce" style={{ animationDelay: `${i * 150}ms` }} aria-hidden="true" />)}
                      </div>
                      <p className="text-xs text-text-muted">Waiting for {engineerName}…</p>
                    </>
                  ) : (
                    <p className="text-xs text-text-muted text-center">Sign first to notify the engineer</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {engineerSigned && (
            <Button size="lg" className="w-full" onClick={() => setStep('escrow')} data-testid="proceed-to-escrow-btn">
              Proceed to Escrow Deposit →
            </Button>
          )}
        </div>
      )}

      {/* Step 5 — Escrow */}
      {step === 'escrow' && (
        <div className="p-6 space-y-5">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-[rgba(255,255,255,0.04)]">
              <span className="text-text-secondary">Contract Amount</span>
              <span className="font-mono text-text-primary">₹{budget > 0 ? budget.toLocaleString('en-IN') : engineerHourlyRate.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[rgba(255,255,255,0.04)]">
              <span className="text-text-secondary">Platform Fee (10%)</span>
              <span className="font-mono text-text-primary">₹{Math.round((budget || engineerHourlyRate) * 0.1).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between py-2 font-semibold">
              <span className="text-text-primary">Total to Deposit</span>
              <span className="font-mono text-accent-amber">₹{Math.round((budget || engineerHourlyRate) * 1.1).toLocaleString('en-IN')}</span>
            </div>
          </div>
          <div className="p-3 bg-[rgba(16,185,129,0.06)] border border-[rgba(16,185,129,0.2)] rounded-xl text-xs text-accent-green">
            Funds are held in escrow and released only when you approve milestones.
          </div>
          <Button size="lg" className="w-full" loading={processing} onClick={handleEscrowPay} data-testid="deposit-escrow-btn">
            Deposit via Razorpay
          </Button>
        </div>
      )}

      {/* Success */}
      {step === 'success' && (
        <div className="flex flex-col items-center justify-center py-12 gap-4 px-6 text-center">
          <div className="w-16 h-16 rounded-full bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.3)] flex items-center justify-center animate-fade-up">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>
          </div>
          <h3 className="font-display font-bold text-xl text-text-primary">Contract Active!</h3>
          <p className="text-text-secondary text-sm">Your contract with {engineerName} is now active. Escrow has been funded.</p>
          <Button size="md" onClick={onClose} data-testid="view-contract-btn">View Contract →</Button>
        </div>
      )}
    </Modal>
  );
}
