'use client';

import * as React from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const MOCK_DISPUTE = {
  id: 'd1',
  productName: 'RAG Pipeline Starter Kit',
  buyerName: 'Vikram Nair',
  buyerInitials: 'VN',
  buyerColor: '#00D4FF',
  sellerName: 'Arjun Sharma',
  sellerInitials: 'AS',
  sellerColor: '#F59E0B',
  amount: 4999,
  reason: 'The product does not work as described. The RAG pipeline fails to connect to Pinecone and the documentation is incomplete.',
  status: 'open',
  createdAt: '2026-05-08',
};

export default function AdminDisputeDetailPage({ params }: { params: { id: string } }) {
  const [resolution, setResolution] = React.useState('');
  const [outcome, setOutcome] = React.useState<'refund_buyer' | 'pay_seller' | 'split' | 'no_action'>('refund_buyer');
  const [saving, setSaving] = React.useState(false);

  async function handleResolve() {
    if (!resolution.trim()) { toast.error('Resolution notes are required'); return; }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 1000));
    setSaving(false);
    toast.success('Dispute resolved');
  }

  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 space-y-6">
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <Link href="/admin/disputes" className="hover:text-text-secondary">Disputes</Link>
          <span>/</span>
          <span className="text-text-secondary">{MOCK_DISPUTE.productName}</span>
        </div>

        {/* Header */}
        <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="font-display font-bold text-xl text-text-primary">{MOCK_DISPUTE.productName}</h1>
            <Badge variant="red">Open Dispute</Badge>
          </div>

          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full flex items-center justify-center font-display font-bold text-bg-base text-xs" style={{ background: MOCK_DISPUTE.buyerColor }} aria-hidden="true">{MOCK_DISPUTE.buyerInitials}</div>
              <div><p className="text-sm text-text-primary">{MOCK_DISPUTE.buyerName}</p><p className="text-xs text-text-muted">Buyer</p></div>
            </div>
            <span className="text-text-muted text-xs">vs</span>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full flex items-center justify-center font-display font-bold text-bg-base text-xs" style={{ background: MOCK_DISPUTE.sellerColor }} aria-hidden="true">{MOCK_DISPUTE.sellerInitials}</div>
              <div><p className="text-sm text-text-primary">{MOCK_DISPUTE.sellerName}</p><p className="text-xs text-text-muted">Seller</p></div>
            </div>
            <div className="ml-auto text-right">
              <p className="font-mono font-bold text-accent-amber">₹{MOCK_DISPUTE.amount.toLocaleString('en-IN')}</p>
              <p className="text-xs text-text-muted">Disputed amount</p>
            </div>
          </div>
        </div>

        {/* Reason */}
        <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
          <h2 className="font-display font-semibold text-text-primary text-lg mb-3">Dispute Reason</h2>
          <p className="text-sm text-text-secondary leading-relaxed">{MOCK_DISPUTE.reason}</p>
          <p className="text-xs text-text-muted font-mono mt-3">Filed on {new Date(MOCK_DISPUTE.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>

        {/* Resolution */}
        <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 space-y-4">
          <h2 className="font-display font-semibold text-text-primary text-lg">Resolve Dispute</h2>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Outcome</label>
            <div className="grid grid-cols-2 gap-2">
              {([
                { value: 'refund_buyer', label: 'Refund Buyer', desc: 'Full refund to buyer' },
                { value: 'pay_seller',  label: 'Pay Seller',   desc: 'Release payment to seller' },
                { value: 'split',       label: 'Split',        desc: 'Partial refund to both' },
                { value: 'no_action',   label: 'No Action',    desc: 'Close without resolution' },
              ] as const).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setOutcome(opt.value)}
                  className={`p-3 rounded-xl text-left border transition-all ${outcome === opt.value ? 'bg-[rgba(0,212,255,0.08)] border-[rgba(0,212,255,0.3)] text-accent-cyan' : 'border-[rgba(255,255,255,0.06)] text-text-muted hover:border-[rgba(255,255,255,0.15)]'}`}
                >
                  <p className="text-sm font-medium">{opt.label}</p>
                  <p className="text-xs opacity-70 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Resolution Notes *</label>
            <textarea
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              rows={3}
              placeholder="Explain the resolution decision..."
              className="w-full bg-bg-elevated border border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,212,255,0.3)] resize-none"
            />
          </div>

          <Button className="w-full" size="lg" loading={saving} onClick={handleResolve}>
            Resolve Dispute
          </Button>
        </div>
      </div>
    </div>
  );
}
