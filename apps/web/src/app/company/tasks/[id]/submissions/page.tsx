'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useTaskSubmissions } from '@/lib/api-hooks';
import { apiFetch, ApiRequestError } from '@/lib/api-fetch';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const STATUS_CONFIG: Record<string, { variant: 'cyan' | 'amber' | 'green' | 'red' | 'gray'; label: string }> = {
  pending:      { variant: 'gray',  label: 'Pending Review' },
  under_review: { variant: 'amber', label: 'Under Review' },
  accepted:     { variant: 'green', label: 'Accepted' },
  rejected:     { variant: 'red',   label: 'Rejected' },
  winner:       { variant: 'cyan',  label: 'Winner 🏆' },
};

const COLORS = ['#F59E0B', '#00D4FF', '#7B5EA7', '#10B981', '#EF4444'];
function colorFromName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

export default function TaskSubmissionsPage({ params }: { params: { id: string } }) {
  const queryClient = useQueryClient();
  const { data: submissions, isLoading, error, refetch } = useTaskSubmissions(params.id);
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'pending' | 'under_review' | 'accepted' | 'rejected' | 'winner'>('all');
  const [sortBy, setSortBy] = React.useState<'score' | 'date' | 'neuron'>('score');
  const [selectingWinnerId, setSelectingWinnerId] = React.useState<string | null>(null);
  const winnerExists = Boolean(submissions?.some((s) => s.status === 'winner'));
  const filteredSubmissions = React.useMemo(() => {
    const source = submissions ?? [];
    const filtered = statusFilter === 'all' ? source : source.filter((s) => s.status === statusFilter);
    return [...filtered].sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
      }
      if (sortBy === 'neuron') {
        return b.neuronScore - a.neuronScore;
      }
      return (b.score ?? 0) - (a.score ?? 0);
    });
  }, [submissions, sortBy, statusFilter]);

  function getWinnerError(err: unknown): string {
    if (err instanceof ApiRequestError && err.status === 409) return err.message;
    if (err instanceof Error && err.message) return err.message;
    return 'Failed to select winner';
  }

  async function handleSelectWinner(submissionId: string) {
    setSelectingWinnerId(submissionId);
    try {
      await apiFetch(`/api/tasks/${params.id}/winner`, {
        method: 'PUT',
        body: JSON.stringify({ submissionId }),
      });
      await queryClient.invalidateQueries({ queryKey: ['task', params.id, 'submissions'] });
      await queryClient.invalidateQueries({ queryKey: ['task', params.id] });
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Winner selected and payout initiated');
    } catch (err) {
      toast.error(getWinnerError(err));
    } finally {
      setSelectingWinnerId(null);
    }
  }

  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 space-y-6">
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <Link href="/company/tasks" className="hover:text-text-secondary">Tasks</Link>
          <span>/</span>
          <Link href={`/company/tasks/${params.id}`} className="hover:text-text-secondary">Task Detail</Link>
          <span>/</span>
          <span className="text-text-secondary">Submissions</span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-text-primary">Submissions</h1>
            {!isLoading && submissions && (
              <p className="text-text-secondary text-sm mt-1">{submissions.length} submission{submissions.length !== 1 ? 's' : ''} received</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="bg-bg-surface border border-[rgba(255,255,255,0.12)] rounded-lg px-3 py-2 text-xs text-text-primary"
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="under_review">Under review</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="winner">Winner</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="bg-bg-surface border border-[rgba(255,255,255,0.12)] rounded-lg px-3 py-2 text-xs text-text-primary"
            >
              <option value="score">Sort by score</option>
              <option value="date">Sort by date</option>
              <option value="neuron">Sort by NeuronScore</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton circle className="w-10 h-10" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl p-8 text-center">
            <p className="text-text-muted text-sm">Failed to load submissions</p>
            <Button className="mt-3" size="sm" variant="secondary" onClick={() => { void refetch(); }}>
              Retry
            </Button>
          </div>
        ) : !submissions || submissions.length === 0 ? (
          <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl p-12 text-center">
            <p className="text-text-muted text-sm">No submissions yet</p>
            <p className="text-text-muted text-xs mt-1">Engineers will submit their work here</p>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl p-12 text-center">
            <p className="text-text-muted text-sm">No submissions match this filter</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSubmissions.map((sub, i) => {
              const statusConfig = STATUS_CONFIG[sub.status] ?? { variant: 'gray' as const, label: sub.status };
              const color = colorFromName(sub.engineerName);
              const initials = sub.engineerName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

              return (
                <div key={sub.id} className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl p-5">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-[rgba(255,255,255,0.06)] flex items-center justify-center text-xs font-mono text-text-muted">
                        #{i + 1}
                      </div>
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center font-display font-bold text-bg-base text-xs"
                        style={{ background: color }}
                        aria-hidden="true"
                      >
                        {initials}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text-primary">{sub.engineerName}</p>
                        <p className="text-xs text-text-muted">
                          Submitted {new Date(sub.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {sub.score !== null && (
                        <span className="font-mono text-lg font-bold text-accent-cyan">
                          {sub.score}<span className="text-xs text-text-muted">/100</span>
                        </span>
                      )}
                      <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                      <Link href={`/company/tasks/${params.id}/submissions/${sub.id}`}>
                        <Button size="sm" variant="secondary">Review →</Button>
                      </Link>
                      {(sub.status === 'accepted' || sub.status === 'under_review') && !winnerExists && (
                        <Button
                          size="sm"
                          onClick={() => { void handleSelectWinner(sub.id); }}
                          loading={selectingWinnerId === sub.id}
                          disabled={selectingWinnerId !== null && selectingWinnerId !== sub.id}
                        >
                          Select Winner
                        </Button>
                      )}
                    </div>
                  </div>

                  {winnerExists && sub.status !== 'winner' && (
                    <div className="mt-3 pt-3 border-t border-[rgba(255,255,255,0.04)]">
                      <p className="text-xs text-text-muted">
                        Winner already selected for this task.
                      </p>
                    </div>
                  )}

                  {(sub.demoUrl || sub.githubUrl) && (
                    <div className="flex gap-3 mt-3 pt-3 border-t border-[rgba(255,255,255,0.04)]">
                      {sub.demoUrl && (
                        <a href={sub.demoUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-accent-cyan hover:underline">
                          🔗 Demo
                        </a>
                      )}
                      {sub.githubUrl && (
                        <a href={sub.githubUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-accent-cyan hover:underline">
                          GitHub →
                        </a>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
