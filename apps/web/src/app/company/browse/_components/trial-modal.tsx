'use client';

import * as React from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface TrialModalProps {
  open: boolean;
  onClose: () => void;
  engineerName: string;
  engineerHourlyRate: number;
}

export function TrialModal({ open, onClose, engineerName, engineerHourlyRate }: TrialModalProps) {
  const [scope, setScope] = React.useState('');
  const [processing, setProcessing] = React.useState(false);
  const [success, setSuccess] = React.useState(false);

  const trialRate = engineerHourlyRate * 2;
  const trialTotal = trialRate * 2;
  const platformFee = Math.round(trialTotal * 0.1);
  const totalDeposit = trialTotal + platformFee;

  async function handleDeposit() {
    setProcessing(true);
    await new Promise((r) => setTimeout(r, 1500));
    setProcessing(false);
    setSuccess(true);
  }

  function handleClose() {
    setSuccess(false);
    setScope('');
    onClose();
  }

  return (
    <Modal open={open} onClose={handleClose} title={success ? undefined : `2-Hour Trial with ${engineerName}`} size="md">
      {success ? (
        <div className="flex flex-col items-center justify-center py-12 gap-4 px-6 text-center">
          <div className="w-16 h-16 rounded-full bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.3)] flex items-center justify-center animate-fade-up">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
          </div>
          <h3 className="font-display font-bold text-xl text-text-primary">Trial Booked!</h3>
          <p className="text-text-secondary text-sm">
            Your 2-hour trial with {engineerName} is confirmed. They&apos;ll reach out within 24 hours.
          </p>
          <Button size="md" onClick={handleClose}>Got it</Button>
        </div>
      ) : (
        <div className="p-6 space-y-5">
          <div className="p-4 bg-[rgba(0,212,255,0.06)] border border-[rgba(0,212,255,0.2)] rounded-xl">
            <p className="text-xs text-accent-cyan mb-2">
              <strong>How it works:</strong> Book a 2-hour trial to test compatibility before committing to a full contract.
            </p>
            <ul className="text-xs text-text-secondary space-y-1 list-disc list-inside">
              <li>2 hours of focused work</li>
              <li>Premium trial rate (2× hourly)</li>
              <li>Full refund if not satisfied</li>
            </ul>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Trial Scope</label>
            <textarea
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              rows={4}
              placeholder="What would you like the engineer to work on during the trial? Be specific about deliverables..."
              className="w-full bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,212,255,0.3)] resize-none"
            />
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-[rgba(255,255,255,0.04)]">
              <span className="text-text-secondary">Trial Rate (2 hours)</span>
              <span className="font-mono text-text-primary">₹{trialTotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[rgba(255,255,255,0.04)]">
              <span className="text-text-secondary">Platform Fee (10%)</span>
              <span className="font-mono text-text-primary">₹{platformFee.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between py-2 font-semibold">
              <span className="text-text-primary">Total to Deposit</span>
              <span className="font-mono text-accent-amber">₹{totalDeposit.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              size="lg"
              className="flex-1"
              loading={processing}
              disabled={!scope.trim()}
              onClick={handleDeposit}
            >
              Deposit & Book Trial
            </Button>
            <Button variant="ghost" size="lg" onClick={handleClose}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
