'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import {
  formatCurrency,
  getTransactionTypeBadgeVariant,
  getStatusBadgeVariant,
} from '@/lib/payments-analytics-data';

// Static plan data — company plans are configured server-side
const PLAN_DATA = {
  name: 'Growth',
  monthlyCost: 9999,
  features: [
    'Up to 10 active contracts',
    'Unlimited job postings',
    'Priority support',
    'Advanced analytics',
    'Custom contract templates',
  ],
};

export default function CompanyBillingPage() {
  const [showAddFundsModal, setShowAddFundsModal] = React.useState(false);

  const plan = PLAN_DATA;

  // Use static fallback data — escrow data comes from contracts which are loaded separately
  const escrowBreakdown = [
    { contractId: 'contract-1', contractTitle: 'Voice AI Agent', amount: 100000, status: 'active' },
    { contractId: 'contract-2', contractTitle: 'MLOps Pipeline', amount: 75000, status: 'active' },
    { contractId: 'contract-3', contractTitle: 'Data Pipeline', amount: 50000, status: 'active' },
  ];
  const totalEscrow = escrowBreakdown.reduce((sum, e) => sum + e.amount, 0);

  // Static invoice history — in production this would come from the payments API
  const transactions = [
    { id: 'inv-1', createdAt: '2026-04-01', description: 'Contract Milestone Payment', amount: 50000, status: 'paid' },
    { id: 'inv-2', createdAt: '2026-03-15', description: 'Escrow Deposit - MLOps', amount: 80000, status: 'paid' },
    { id: 'inv-3', createdAt: '2026-03-01', description: 'Platform Subscription', amount: 11799, status: 'paid' },
  ];

  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-text-primary mb-1">Billing & Payments</h1>
          <p className="text-text-secondary text-sm">Manage your subscription and escrow funds</p>
        </div>

        {/* Current Plan Card */}
        <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h2 className="font-display font-bold text-xl text-text-primary">{plan.name} Plan</h2>
                {<Badge variant="cyan">Current</Badge>}
              </div>
              <p className="text-text-muted text-sm">Perfect for growing teams</p>
            </div>
            <div className="text-right">
              <p className="font-display text-3xl font-bold text-text-primary">
                <span className="font-mono">{formatCurrency(plan.monthlyCost)}</span>
              </p>
              <p className="text-xs text-text-muted">per month</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-xs text-text-muted uppercase tracking-wider mb-3">Features</p>
              <ul className="space-y-2">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#00D4FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5" aria-hidden="true">
                      <path d="M3 8l3 3 7-7"/>
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex items-center justify-center">
              <Button size="lg" variant="secondary">
                Upgrade Plan
              </Button>
            </div>
          </div>

          <div className="pt-4 border-t border-[rgba(255,255,255,0.06)] text-xs text-text-muted">
            Next billing date: <strong className="text-text-secondary">December 1, 2024</strong>
          </div>
        </div>

        {/* Escrow Balance */}
        <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display font-semibold text-text-primary text-lg mb-1">Escrow Balance</h2>
              <p className="text-text-muted text-sm">Funds held for active contracts</p>
            </div>
            <Button size="md" onClick={() => setShowAddFundsModal(true)} data-testid="add-funds-btn">
              Add Funds
            </Button>
          </div>

          <div className="mb-6">
            <p className="text-sm text-text-muted mb-2">Total in Escrow</p>
            <p className="font-display text-4xl font-bold text-accent-cyan">
              <span className="font-mono">{formatCurrency(totalEscrow)}</span>
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-xs text-text-muted uppercase tracking-wider">Per-Contract Breakdown</p>
            {escrowBreakdown.map((escrow) => (
              <div
                key={escrow.contractId}
                className="flex items-center justify-between p-3 bg-bg-elevated rounded-xl border border-[rgba(255,255,255,0.04)]"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary truncate">{escrow.contractTitle}</p>
                  <p className="text-xs text-text-muted">Contract #{escrow.contractId}</p>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="font-mono font-semibold text-accent-cyan">{formatCurrency(escrow.amount)}</p>
                  <Badge variant="cyan" className="text-[9px] mt-1">{escrow.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Invoice History */}
        <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
          <h2 className="font-display font-semibold text-text-primary text-lg mb-4">Invoice History</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.06)]">
                  <th className="text-left py-3 px-4 text-xs font-medium text-text-muted uppercase">Date</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-text-muted uppercase">Description</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-text-muted uppercase">Amount</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-text-muted uppercase">Status</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-text-muted uppercase">GST Invoice</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((txn) => (
                  <tr key={txn.id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.02)]">
                    <td className="py-3 px-4 text-text-secondary">
                      {new Date(txn.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </td>
                    <td className="py-3 px-4 text-text-primary">{txn.description}</td>
                    <td className="py-3 px-4 text-right">
                      <span className="font-mono font-semibold text-text-primary">
                        {formatCurrency(Math.abs(txn.amount))}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant={getStatusBadgeVariant(txn.status as any)} className="text-[10px]">
                        {txn.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <a href={`/invoices/gst-${txn.id}.pdf`} download className="text-accent-cyan hover:underline text-xs">
                        ↓ Download
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Funds Modal */}
      <AddFundsModal
        open={showAddFundsModal}
        onClose={() => setShowAddFundsModal(false)}
      />
    </div>
  );
}

// ─── Add Funds Modal ──────────────────────────────────────────
interface AddFundsModalProps {
  open: boolean;
  onClose: () => void;
}

function AddFundsModal({ open, onClose }: AddFundsModalProps) {
  const [amount, setAmount] = React.useState('');
  const [processing, setProcessing] = React.useState(false);
  const [success, setSuccess] = React.useState(false);

  const amountNum = parseFloat(amount) || 0;
  const gst = amountNum * 0.18;
  const total = amountNum + gst;

  async function handleAddFunds() {
    if (amountNum <= 0) return;
    setProcessing(true);
    await new Promise((r) => setTimeout(r, 2000));
    setProcessing(false);
    setSuccess(true);
  }

  function handleClose() {
    setSuccess(false);
    setAmount('');
    onClose();
  }

  return (
    <Modal open={open} onClose={handleClose} title={success ? undefined : 'Add Funds to Escrow'} size="md">
      {success ? (
        <div className="flex flex-col items-center justify-center py-12 gap-4 px-6 text-center">
          <div className="w-16 h-16 rounded-full bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.3)] flex items-center justify-center animate-fade-up">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
          </div>
          <h3 className="font-display font-bold text-xl text-text-primary">Funds Added!</h3>
          <p className="text-text-secondary text-sm">
            <span className="font-mono text-accent-green">{formatCurrency(total)}</span> has been added to your escrow balance.
          </p>
          <Button size="md" onClick={handleClose}>Got it</Button>
        </div>
      ) : (
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Amount to Add</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted font-mono pointer-events-none">₹</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full bg-bg-elevated border border-[rgba(255,255,255,0.06)] rounded-xl pl-10 pr-4 py-3 font-mono text-xl text-text-primary focus:outline-none focus:border-[rgba(0,212,255,0.3)]"
                data-testid="add-funds-amount-input"
              />
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b border-[rgba(255,255,255,0.04)]">
              <span className="text-text-secondary">Amount</span>
              <span className="font-mono text-text-primary">{formatCurrency(amountNum)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[rgba(255,255,255,0.04)]">
              <span className="text-text-secondary">GST (18%)</span>
              <span className="font-mono text-text-primary">{formatCurrency(gst)}</span>
            </div>
            <div className="flex justify-between py-2 font-semibold">
              <span className="text-text-primary">Total</span>
              <span className="font-mono text-accent-cyan">{formatCurrency(total)}</span>
            </div>
          </div>

          <div className="p-3 bg-[rgba(0,212,255,0.06)] border border-[rgba(0,212,255,0.2)] rounded-xl text-xs text-accent-cyan">
            Funds will be held in escrow and released to engineers upon milestone approval.
          </div>

          <div className="flex gap-3">
            <Button
              size="lg"
              className="flex-1"
              loading={processing}
              disabled={amountNum <= 0}
              onClick={handleAddFunds}
              data-testid="confirm-add-funds-btn"
            >
              Pay via Razorpay
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
