'use client';

import * as React from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useAdminAssessmentDetail, useAdminAssessmentDecision } from '@/lib/api-hooks';

export default function AdminAssessmentDetailPage({ params }: { params: { id: string } }) {
  const { data: assessment, isLoading, error } = useAdminAssessmentDetail(params.id);
  const decision = useAdminAssessmentDecision();
  const [notes, setNotes] = React.useState('');

  async function handleDecision(d: 'approve' | 'reject' | 'flag') {
    try {
      await decision.mutateAsync({ assessmentId: params.id, decision: d, notes });
      toast.success(`Assessment ${d}d`);
    } catch (e: any) {
      toast.error(e.message || 'Failed to update assessment');
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-base">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 space-y-6">
          <Skeleton className="h-4 w-48" />
          <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <Skeleton circle className="w-12 h-12" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-56" />
              </div>
            </div>
          </div>
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-60 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-muted">Failed to load assessment details</p>
          <Link href="/admin/assessments" className="mt-4 text-accent-cyan hover:underline text-sm block">
            ← Back to assessments
          </Link>
        </div>
      </div>
    );
  }

  const initials = assessment.engineerName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 space-y-6">
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <Link href="/admin/assessments" className="hover:text-text-secondary">Assessments</Link>
          <span>/</span>
          <span className="text-text-secondary">{assessment.engineerName}</span>
        </div>

        {/* Header */}
        <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center font-display font-bold text-bg-base bg-[#F59E0B]" aria-hidden="true">
                {initials}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="font-display font-bold text-xl text-text-primary">{assessment.engineerName}</h1>
                  {assessment.flagged && <Badge variant="red">⚠ Flagged</Badge>}
                  {assessment.plagiarismFlagged && <Badge variant="red">Plagiarism</Badge>}
                </div>
                <p className="text-sm text-text-muted">{assessment.email}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-mono font-bold text-3xl text-accent-cyan">{assessment.overallScore ?? '—'}</p>
              <p className="text-xs text-text-muted">Overall Score</p>
              {assessment.tier && (
                <Badge variant="violet" className="mt-1 capitalize">{assessment.tier}</Badge>
              )}
            </div>
          </div>
        </div>

        {/* Proctoring flags */}
        {assessment.flagged && (
          <div className="bg-[rgba(239,68,68,0.06)] border border-[rgba(239,68,68,0.2)] rounded-2xl p-5">
            <h2 className="font-display font-semibold text-accent-red mb-3">Proctoring Violations</h2>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Tab Switches',   value: assessment.tabSwitches },
                { label: 'Focus Losses',   value: assessment.focusLosses },
                { label: 'Paste Attempts', value: assessment.pasteAttempts },
              ].map((item) => (
                <div key={item.label} className="bg-bg-elevated rounded-xl p-3 text-center">
                  <p className="font-mono font-bold text-xl text-accent-red">{item.value}</p>
                  <p className="text-xs text-text-muted mt-0.5">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Score breakdown */}
        <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 space-y-4">
          <h2 className="font-display font-semibold text-text-primary text-lg">Score Breakdown</h2>
          <div className="grid grid-cols-3 gap-4 mb-4">
            {[
              { label: 'MCQ',    value: assessment.mcqScore,    color: '#00D4FF' },
              { label: 'Coding', value: assessment.codingScore,  color: '#7B5EA7' },
              { label: 'Case',   value: assessment.caseScore,    color: '#F59E0B' },
            ].map((s) => (
              <div key={s.label} className="bg-bg-elevated rounded-xl p-3 text-center">
                <p className="font-mono font-bold text-xl" style={{ color: s.color }}>{s.value ?? '—'}</p>
                <p className="text-xs text-text-muted mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="space-y-3">
            {Object.entries(assessment.dimensions).map(([key, value]) => (
              <div key={key}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-text-secondary capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                  <span className="text-xs font-mono text-text-muted">{value ?? '—'}/100</span>
                </div>
                <Progress value={value ?? 0} color="cyan" size="sm" />
              </div>
            ))}
          </div>
        </div>

        {/* Admin decision */}
        <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 space-y-4">
          <h2 className="font-display font-semibold text-text-primary text-lg">Admin Decision</h2>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Add notes about this assessment..."
              className="w-full bg-bg-elevated border border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,212,255,0.3)] resize-none"
            />
          </div>
          <div className="flex gap-3">
            <Button className="flex-1" size="md" loading={decision.isPending} onClick={() => handleDecision('approve')}>✓ Approve</Button>
            <Button variant="secondary" size="md" onClick={() => handleDecision('flag')}>🚩 Flag</Button>
            <Button variant="danger" size="md" onClick={() => handleDecision('reject')}>Reject</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
