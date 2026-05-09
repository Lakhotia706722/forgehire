'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminAssessments, useAdminAssessmentDecision } from '@/lib/api-hooks';

type AssessmentStatus = 'completed' | 'flagged' | 'in_progress';

export default function AdminAssessmentsPage() {
  const [filter, setFilter] = React.useState<AssessmentStatus | 'all'>('all');
  const [reviewing, setReviewing] = React.useState<any | null>(null);
  const decision = useAdminAssessmentDecision();

  const { data, isLoading } = useAdminAssessments(filter);
  const assessments = data?.assessments ?? [];
  const filtered = assessments.filter((a) => filter === 'all' || a.status === filter);

  async function handleDecision(id: string, d: 'approve' | 'flag' | 'reject') {
    await decision.mutateAsync({ assessmentId: id, decision: d, notes: '' });
    setReviewing(null);
  }

  const statusBadge = (status: string, flagCount: number) => {
    if (status === 'flagged') return <Badge variant="red">Flagged ({flagCount})</Badge>;
    if (status === 'in_progress') return <Badge variant="amber">In Progress</Badge>;
    return <Badge variant="green">Completed</Badge>;
  };

  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary mb-1">Assessment Queue</h1>
          <p className="text-text-secondary text-sm">{data?.total ?? 0} assessments</p>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2" role="group" aria-label="Filter assessments">
          {(['all', 'completed', 'flagged', 'in_progress'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                filter === f ? 'bg-accent-cyan text-bg-base' : 'text-text-muted hover:text-text-secondary'
              )}
            >
              {f === 'all' ? 'All' : f === 'in_progress' ? 'In Progress' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" aria-label="Assessments table">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.06)]">
                  <th className="py-3 px-4 text-left text-xs font-medium text-text-muted uppercase">Engineer</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-text-muted uppercase">Track</th>
                  <th className="py-3 px-4 text-right text-xs font-medium text-text-muted uppercase">Score</th>
                  <th className="py-3 px-4 text-center text-xs font-medium text-text-muted uppercase">Status</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-text-muted uppercase">Completed</th>
                  <th className="py-3 px-4 text-center text-xs font-medium text-text-muted uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-[rgba(255,255,255,0.04)]">
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="py-3 px-4"><Skeleton className="h-4 w-full" /></td>
                      ))}
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-text-muted text-sm">No assessments found</td>
                  </tr>
                ) : (
                  filtered.map((a) => (
                    <tr key={a.id} className={cn('border-b border-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.02)]', a.flagCount > 0 && 'bg-[rgba(239,68,68,0.03)]')}>
                      <td className="py-3 px-4">
                        <p className="text-text-primary font-medium">{a.engineerName}</p>
                        <p className="text-xs text-text-muted">{a.engineerEmail}</p>
                      </td>
                      <td className="py-3 px-4 text-text-secondary">{a.track}</td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-accent-cyan">{a.score ?? '—'}</td>
                      <td className="py-3 px-4 text-center">{statusBadge(a.status, a.flagCount)}</td>
                      <td className="py-3 px-4 text-text-muted text-xs">
                        {a.completedAt ? new Date(a.completedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setReviewing(a)}
                            className="text-xs text-accent-cyan hover:underline"
                            data-testid={`review-assessment-${a.id}`}
                          >
                            Review
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Review modal */}
      {reviewing && (
        <Modal open={!!reviewing} onClose={() => setReviewing(null)} title={`Review: ${reviewing.engineerName}`} size="md">
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { label: 'Score', value: reviewing.score ?? '—', color: '#00D4FF' },
                { label: 'Flags', value: reviewing.flagCount, color: reviewing.flagCount > 0 ? '#EF4444' : '#10B981' },
                { label: 'Duration', value: `${reviewing.duration}m`, color: '#F59E0B' },
              ].map((s) => (
                <div key={s.label} className="bg-bg-elevated rounded-xl p-3">
                  <p className="font-mono font-bold text-xl" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-xs text-text-muted mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Flag types */}
            {reviewing.flagTypes && reviewing.flagTypes.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {reviewing.flagTypes.map((flag: string) => (
                  <span key={flag} className="text-xs px-2 py-1 rounded bg-[rgba(239,68,68,0.1)] text-accent-red border border-[rgba(239,68,68,0.2)] font-mono">
                    {flag.replace(/_/g, ' ').toUpperCase()}
                  </span>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => handleDecision(reviewing.id, 'approve')}
                className="flex-1 py-2.5 rounded-xl bg-accent-cyan text-bg-base text-sm font-semibold"
                data-testid="approve-assessment"
              >
                Approve
              </button>
              <button
                onClick={() => handleDecision(reviewing.id, 'flag')}
                className="py-2.5 px-4 rounded-xl border border-[rgba(245,158,11,0.3)] text-accent-amber text-sm"
                data-testid="override-assessment"
              >
                Override
              </button>
              <button
                onClick={() => handleDecision(reviewing.id, 'reject')}
                className="py-2.5 px-4 rounded-xl border border-[rgba(239,68,68,0.3)] text-accent-red text-sm"
                data-testid="reject-assessment"
              >
                Reject
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
