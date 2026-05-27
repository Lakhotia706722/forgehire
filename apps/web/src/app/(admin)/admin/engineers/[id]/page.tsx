'use client';

import * as React from 'react';
import Link from 'next/link';
import { Badge, TierBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { NeuronScoreRing } from '@/components/ui/neuron-score-ring';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { avatarToneClass } from '@/lib/avatar-tone';
import { useAdminEngineerDetail, useAdminScoreOverride, useAdminSuspendEngineer } from '@/lib/api-hooks';

export default function AdminEngineerDetailPage({ params }: { params: { id: string } }) {
  const { data: engineer, isLoading, error } = useAdminEngineerDetail(params.id);
  const scoreOverride = useAdminScoreOverride();
  const suspend = useAdminSuspendEngineer();

  const [overrideScore, setOverrideScore] = React.useState('');
  const [overrideReason, setOverrideReason] = React.useState('');

  async function handleScoreOverride() {
    if (!overrideScore || !overrideReason) { toast.error('Score and reason are required'); return; }
    try {
      await scoreOverride.mutateAsync({
        engineerId: params.id,
        score: parseInt(overrideScore),
        reason: overrideReason,
      });
      toast.success(`Score overridden to ${overrideScore}`);
      setOverrideScore('');
      setOverrideReason('');
    } catch (e: any) {
      toast.error(e.message || 'Failed to override score');
    }
  }

  async function handleSuspend() {
    try {
      await suspend.mutateAsync(params.id);
      toast.success('Engineer suspended');
    } catch (e: any) {
      toast.error(e.message || 'Failed to suspend engineer');
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-base">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 space-y-6">
          <Skeleton className="h-4 w-48" />
          <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <Skeleton circle className="w-14 h-14" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-56" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !engineer) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-muted">Failed to load engineer details</p>
          <Link href="/admin/engineers" className="mt-4 text-accent-cyan hover:underline text-sm block">
            ← Back to engineers
          </Link>
        </div>
      </div>
    );
  }

  const initials = engineer.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <Link href="/admin/engineers" className="hover:text-text-secondary">Engineers</Link>
          <span>/</span>
          <span className="text-text-secondary">{engineer.fullName}</span>
        </div>

        {/* Profile header */}
        <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center font-display font-bold text-bg-base text-xl', avatarToneClass(engineer.fullName))} aria-hidden="true">
                {initials}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="font-display font-bold text-xl text-text-primary">{engineer.fullName}</h1>
                  <TierBadge tier={engineer.neuronTier} />
                  {engineer.kycVerified && <Badge variant="green">KYC ✓</Badge>}
                  {engineer.flagged && <Badge variant="red">⚠ Flagged</Badge>}
                </div>
                <p className="text-sm text-text-muted">{engineer.email}</p>
                <p className="text-xs text-text-muted mt-0.5">
                  Joined {new Date(engineer.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>
            <NeuronScoreRing score={engineer.neuronScore} size={72} strokeWidth={5} animate={false} />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Assessments', value: engineer.assessmentCount, valueClass: 'stat-value-cyan' },
            { label: 'Contracts',   value: engineer.contractCount,   valueClass: 'stat-value-violet' },
            { label: 'Products',    value: engineer.productCount,    valueClass: 'stat-value-amber' },
            { label: 'Completeness', value: `${engineer.completenessScore}%`, valueClass: 'stat-value-green' },
          ].map((stat) => (
            <div key={stat.label} className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl p-4 text-center">
              <p className={cn('font-mono font-bold text-xl', stat.valueClass)}>{stat.value}</p>
              <p className="text-xs text-text-muted mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Skills */}
        {engineer.skills.length > 0 && (
          <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-5">
            <h2 className="font-display font-semibold text-text-primary mb-3">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {engineer.skills.map(s => (
                <Badge key={s} variant="gray">{s}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* Profile completeness */}
        <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-semibold text-text-primary">Profile Completeness</h2>
            <span className="font-mono text-accent-cyan">{engineer.completenessScore}%</span>
          </div>
          <Progress value={engineer.completenessScore} color="cyan" size="md" />
        </div>

        {/* Admin actions */}
        <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 space-y-5">
          <h2 className="font-display font-semibold text-text-primary text-lg">Admin Actions</h2>

          {/* Score override */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-text-secondary">Override NeuronScore</h3>
            <div className="flex gap-3">
              <input
                type="number"
                value={overrideScore}
                onChange={(e) => setOverrideScore(e.target.value)}
                placeholder="New score (0-1000)"
                min={0}
                max={1000}
                className="flex-1 bg-bg-elevated border border-[rgba(255,255,255,0.06)] rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-[rgba(0,212,255,0.3)]"
              />
              <input
                type="text"
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="Reason for override"
                className="flex-1 bg-bg-elevated border border-[rgba(255,255,255,0.06)] rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-[rgba(0,212,255,0.3)]"
              />
              <Button size="sm" loading={scoreOverride.isPending} onClick={handleScoreOverride}>Override</Button>
            </div>
          </div>

          {/* Suspend */}
          <div className="flex items-center justify-between p-4 bg-[rgba(239,68,68,0.06)] border border-[rgba(239,68,68,0.2)] rounded-xl">
            <div>
              <p className="text-sm font-medium text-text-primary">Suspend Engineer</p>
              <p className="text-xs text-text-muted mt-0.5">Temporarily disable this engineer&apos;s account</p>
            </div>
            <Button variant="danger" size="sm" loading={suspend.isPending} onClick={handleSuspend}>Suspend</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
