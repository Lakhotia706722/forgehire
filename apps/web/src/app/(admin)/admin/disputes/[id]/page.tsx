'use client';

import * as React from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAdminDisputeDetail } from '@/lib/api-hooks';
import { Skeleton } from '@/components/ui/skeleton';
import { apiFetch } from '@/lib/api-fetch';
import { cn } from '@/lib/utils';
import { avatarToneClass, initialsFromName } from '@/lib/avatar-tone';
export default function AdminDisputeDetailPage({ params }: { params: { id: string } }) {
  const { data: dispute, isLoading } = useAdminDisputeDetail(params.id);
  const [resolution, setResolution] = React.useState('');
  const [outcome, setOutcome] = React.useState<'refund_buyer' | 'pay_seller' | 'split' | 'no_action'>('refund_buyer');
  const [saving, setSaving] = React.useState(false);

  async function handleResolve() {
    if (!resolution.trim()) { toast.error('Resolution notes are required'); return; }
    setSaving(true);
    try {
      await apiFetch(`/api/admin/disputes/${params.id}/resolve`, {
        method: 'PUT',
        body: JSON.stringify({ resolution, outcome }),
      });
      toast.success('Dispute resolved');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to resolve');
    } finally {
      setSaving(false);
    }
  }

  if (isLoading || !dispute) {
    return (
      <div className="min-h-screen bg-bg-base p-8 max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 space-y-6">
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <Link href="/admin/disputes" className="hover:text-text-secondary">Disputes</Link>
          <span>/</span>
          <span className="text-text-secondary">{dispute.productName}</span>
        </div>

        {/* Header */}
        <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="font-display font-bold text-xl text-text-primary">{dispute.productName}</h1>
            <Badge variant="red">Open Dispute</Badge>
          </div>

          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className={cn('w-9 h-9 rounded-full flex items-center justify-center font-display font-bold text-bg-base text-xs', avatarToneClass(dispute.buyerName))} aria-hidden="true">{initialsFromName(dispute.buyerName)}</div>
              <div><p className="text-sm text-text-primary">{dispute.buyerName}</p><p className="text-xs text-text-muted">Buyer</p></div>
            </div>
            <span className="text-text-muted text-xs">vs</span>
            <div className="flex items-center gap-2">
              <div className={cn('w-9 h-9 rounded-full flex items-center justify-center font-display font-bold text-bg-base text-xs', avatarToneClass(dispute.sellerName))} aria-hidden="true">{initialsFromName(dispute.sellerName)}</div>
              <div><p className="text-sm text-text-primary">{dispute.sellerName}</p><p className="text-xs text-text-muted">Seller</p></div>
            </div>
            <div className="ml-auto text-right">
              <p className="font-mono font-bold text-accent-amber">₹{Number(dispute.amount).toLocaleString('en-IN')}</p>
              <p className="text-xs text-text-muted">Disputed amount</p>
            </div>
          </div>
        </div>

        {/* Reason */}
        <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
          <h2 className="font-display font-semibold text-text-primary text-lg mb-3">Dispute Reason</h2>
          <p className="text-sm text-text-secondary leading-relaxed">{dispute.reason}</p>
          <p className="text-xs text-text-muted font-mono mt-3">Filed on {new Date(dispute.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
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
