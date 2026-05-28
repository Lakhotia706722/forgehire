'use client';

import * as React from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useTaskDetail, useTaskSubmissions } from '@/lib/api-hooks';
import { apiFetch, ApiRequestError } from '@/lib/api-fetch';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
}

function formatINR(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '—';
  return `₹${Number(value).toLocaleString('en-IN')}`;
}

export default function CompanyTaskDetailPage({ params }: { params: { id: string } }) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = React.useState<'overview' | 'submissions' | 'participants'>('overview');
  const [showEdit, setShowEdit] = React.useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = React.useState(false);
  const [showRejectModal, setShowRejectModal] = React.useState(false);
  const [selectedParticipationId, setSelectedParticipationId] = React.useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [closing, setClosing] = React.useState(false);
  const [updatingParticipant, setUpdatingParticipant] = React.useState(false);
  const [answeringQuestionId, setAnsweringQuestionId] = React.useState<string | null>(null);
  const [questionAnswer, setQuestionAnswer] = React.useState<Record<string, string>>({});
  const [title, setTitle] = React.useState('');
  const [problemStatement, setProblemStatement] = React.useState('');
  const [expectedOutcome, setExpectedOutcome] = React.useState('');
  const [rewardAmount, setRewardAmount] = React.useState('');
  const [minNeuronScore, setMinNeuronScore] = React.useState('');
  const { data: task, isLoading, isError, refetch } = useTaskDetail(params.id);
  const { data: submissions = [], isLoading: submissionsLoading } = useTaskSubmissions(params.id);

  React.useEffect(() => {
    if (!task) return;
    const taskData = task as any;
    setTitle(taskData.title ?? '');
    setProblemStatement(taskData.problemStatement ?? '');
    setExpectedOutcome(taskData.expectedOutcome ?? '');
    setRewardAmount(String(taskData.rewardAmount ?? ''));
    setMinNeuronScore(String(taskData.minNeuronScore ?? 0));
  }, [task]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-base">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 space-y-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        </div>
      </div>
    );
  }

  if (isError || !task) {
    return (
      <div className="min-h-screen bg-bg-base">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
          <Link href="/company/tasks" className="text-sm text-accent-cyan hover:underline">← Back to tasks</Link>
          <p className="text-text-muted text-sm mt-4">Task not found.</p>
          <Button className="mt-4" size="sm" variant="secondary" onClick={() => { void refetch(); }}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const taskData = task as any;
  const isTaskFinalized = taskData.status === 'completed' || taskData.status === 'cancelled';

  function getActionError(err: unknown, fallback: string): string {
    if (err instanceof ApiRequestError && err.status === 409) {
      return err.message;
    }
    if (err instanceof Error && err.message) {
      return err.message;
    }
    return fallback;
  }

  async function handleSaveTask() {
    if (title.trim().length < 10) {
      toast.error('Title must be at least 10 characters');
      return;
    }
    if (problemStatement.trim().length < 50) {
      toast.error('Problem statement must be at least 50 characters');
      return;
    }
    if (expectedOutcome.trim().length < 30) {
      toast.error('Expected outcome must be at least 30 characters');
      return;
    }
    setSaving(true);
    try {
      await apiFetch(`/api/tasks/${params.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: title.trim(),
          problemStatement: problemStatement.trim(),
          expectedOutcome: expectedOutcome.trim(),
          rewardAmount: Number(rewardAmount),
          minNeuronScore: Number(minNeuronScore),
        }),
      });
      await queryClient.invalidateQueries({ queryKey: ['task', params.id] });
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setShowEdit(false);
      toast.success('Task updated successfully');
    } catch (err) {
      toast.error(getActionError(err, 'Failed to update task'));
    } finally {
      setSaving(false);
    }
  }

  async function handleCloseTask() {
    setClosing(true);
    try {
      await apiFetch(`/api/tasks/${params.id}/close`, { method: 'POST' });
      await queryClient.invalidateQueries({ queryKey: ['task', params.id] });
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setShowCloseConfirm(false);
      toast.success('Task closed successfully');
    } catch (err) {
      toast.error(getActionError(err, 'Failed to close task'));
    } finally {
      setClosing(false);
    }
  }

  async function handleApproveParticipation(participationId: string) {
    setUpdatingParticipant(true);
    try {
      await apiFetch(`/api/tasks/${params.id}/participations/${participationId}/approve`, {
        method: 'POST',
      });
      await queryClient.invalidateQueries({ queryKey: ['task', params.id] });
      toast.success('Participant approved');
    } catch (err) {
      toast.error(getActionError(err, 'Failed to approve participant'));
    } finally {
      setUpdatingParticipant(false);
    }
  }

  async function handleRejectParticipation() {
    if (!selectedParticipationId) return;
    setUpdatingParticipant(true);
    try {
      await apiFetch(`/api/tasks/${params.id}/participations/${selectedParticipationId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ rejectionReason: rejectionReason.trim() || null }),
      });
      await queryClient.invalidateQueries({ queryKey: ['task', params.id] });
      setShowRejectModal(false);
      setSelectedParticipationId(null);
      setRejectionReason('');
      toast.success('Participant rejected');
    } catch (err) {
      toast.error(getActionError(err, 'Failed to reject participant'));
    } finally {
      setUpdatingParticipant(false);
    }
  }

  async function handleAnswerQuestion(questionId: string) {
    const answer = (questionAnswer[questionId] ?? '').trim();
    if (answer.length < 10) {
      toast.error('Answer must be at least 10 characters');
      return;
    }
    setAnsweringQuestionId(questionId);
    try {
      await apiFetch(`/api/tasks/${params.id}/questions/${questionId}/answer`, {
        method: 'PUT',
        body: JSON.stringify({ answer }),
      });
      await queryClient.invalidateQueries({ queryKey: ['task', params.id] });
      setQuestionAnswer((prev) => ({ ...prev, [questionId]: '' }));
      toast.success('Answer posted');
    } catch (err) {
      toast.error(getActionError(err, 'Failed to answer question'));
    } finally {
      setAnsweringQuestionId(null);
    }
  }

  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 space-y-6">
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <Link href="/company/tasks" className="hover:text-text-secondary transition-colors">Tasks</Link>
          <span>/</span>
          <span className="text-text-secondary truncate">{taskData.title}</span>
        </div>

        <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="cyan">{taskData.status}</Badge>
                <Badge variant="gray">{taskData.type}</Badge>
                {taskData.ndaRequired && <Badge variant="amber">NDA Required</Badge>}
              </div>
              <h1 className="font-display font-bold text-xl text-text-primary">{taskData.title}</h1>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowEdit(true)}
                disabled={isTaskFinalized}
              >
                Edit Task
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setShowCloseConfirm(true)}
                disabled={isTaskFinalized}
              >
                Close Task
              </Button>
            </div>
          </div>

          {isTaskFinalized && (
            <p className="text-xs text-text-muted mb-3">
              This task is finalized ({taskData.status}). Editing and participant decisions are disabled.
            </p>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Reward',       value: `₹${Number(taskData.rewardAmount).toLocaleString('en-IN')}`, colorClass: 'text-accent-amber' },
              { label: 'Participants', value: taskData.participantCount ?? taskData._count?.participations ?? 0, colorClass: 'text-accent-cyan' },
              { label: 'Submissions',  value: taskData.submissionCount ?? taskData._count?.submissions ?? submissions.length, colorClass: 'text-accent-violet' },
              { label: 'Min Score',    value: taskData.minNeuronScore ?? '—', colorClass: 'text-accent-green' },
            ].map((stat) => (
              <div key={stat.label} className="bg-bg-elevated rounded-xl p-3 text-center">
                <p className={cn('font-mono font-bold text-lg', stat.colorClass)}>{stat.value}</p>
                <p className="text-xs text-text-muted mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2 border-b border-[rgba(255,255,255,0.06)]">
          {(['overview', 'submissions', 'participants'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-4 py-2.5 text-sm font-medium transition-all relative capitalize',
                activeTab === tab ? 'text-text-primary' : 'text-text-muted hover:text-text-secondary'
              )}
            >
              {tab}
              {tab === 'submissions' && submissions.length > 0 && (
                <span className="ml-1.5 text-[10px] font-mono bg-accent-cyan text-bg-base px-1.5 py-0.5 rounded-full">
                  {submissions.length}
                </span>
              )}
              {activeTab === tab && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-cyan rounded-full" />}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-5 animate-fade-up">
            <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 space-y-4">
              {taskData.problemStatement && (
                <div>
                  <h3 className="text-sm font-medium text-text-secondary mb-2">Problem Statement</h3>
                  <p className="text-sm text-text-primary leading-relaxed">{taskData.problemStatement}</p>
                </div>
              )}
              {taskData.expectedOutcome && (
                <div>
                  <h3 className="text-sm font-medium text-text-secondary mb-2">Expected Outcome</h3>
                  <p className="text-sm text-text-primary leading-relaxed">{taskData.expectedOutcome}</p>
                </div>
              )}
              {taskData.techRequirements?.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-text-secondary mb-2">Tech Requirements</h3>
                  <div className="flex flex-wrap gap-2">
                    {taskData.techRequirements.map((tech: string) => (
                      <Badge key={tech} variant="gray">{tech}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
              <h3 className="text-sm font-medium text-text-secondary mb-3">Escrow Status</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-bg-elevated rounded-lg p-3">
                  <p className="text-xs text-text-muted">Funding</p>
                  <p className="text-sm text-text-primary mt-1">
                    {taskData.escrowDeposited ? 'Funded' : taskData.status === 'pending_escrow' ? 'Pending' : 'Not started'}
                  </p>
                </div>
                <div className="bg-bg-elevated rounded-lg p-3">
                  <p className="text-xs text-text-muted">Escrow ID</p>
                  <p className="text-sm text-text-primary mt-1 font-mono">{taskData.escrowId ?? '—'}</p>
                </div>
                <div className="bg-bg-elevated rounded-lg p-3">
                  <p className="text-xs text-text-muted">Escrow Amount</p>
                  <p className="text-sm text-accent-amber mt-1 font-mono">
                    {taskData.escrowAmount != null ? `₹${Number(taskData.escrowAmount).toLocaleString('en-IN')}` : '—'}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
              <h3 className="text-sm font-medium text-text-secondary mb-3">Public Q&A</h3>
              {!Array.isArray(taskData.questions) || taskData.questions.length === 0 ? (
                <p className="text-sm text-text-muted">No questions yet.</p>
              ) : (
                <div className="space-y-4">
                  {taskData.questions.map((q: any) => (
                    <div key={q.id} className="bg-bg-elevated rounded-xl p-4">
                      <p className="text-sm text-text-primary">{q.question}</p>
                      <p className="text-xs text-text-muted mt-1">
                        Asked {new Date(q.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </p>
                      {q.answer ? (
                        <div className="mt-3 border-t border-[rgba(255,255,255,0.06)] pt-3">
                          <p className="text-xs text-text-muted">Answer</p>
                          <p className="text-sm text-text-secondary mt-1">{q.answer}</p>
                        </div>
                      ) : (
                        <div className="mt-3 border-t border-[rgba(255,255,255,0.06)] pt-3 space-y-2">
                          <textarea
                            rows={2}
                            value={questionAnswer[q.id] ?? ''}
                            onChange={(e) => setQuestionAnswer((prev) => ({ ...prev, [q.id]: e.target.value }))}
                            placeholder="Write answer..."
                            className="w-full bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-lg px-3 py-2 text-sm text-text-primary"
                          />
                          <Button
                            size="sm"
                            onClick={() => { void handleAnswerQuestion(q.id); }}
                            loading={answeringQuestionId === q.id}
                            disabled={answeringQuestionId !== null && answeringQuestionId !== q.id}
                          >
                            Post Answer
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'submissions' && (
          <div className="space-y-4 animate-fade-up">
            {submissionsLoading ? (
              <Skeleton className="h-24 w-full rounded-xl" />
            ) : submissions.length === 0 ? (
              <p className="text-text-muted text-sm text-center py-12">No submissions yet.</p>
            ) : (
              submissions.map((sub) => (
                <div key={sub.id} className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center font-display font-bold text-bg-base text-xs bg-accent-violet" aria-hidden="true">
                        {initials(sub.engineerName)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text-primary">{sub.engineerName}</p>
                        <p className="text-xs text-text-muted">
                          Submitted {new Date(sub.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {sub.score != null && (
                        <span className="font-mono text-sm font-bold text-accent-cyan">{sub.score}/100</span>
                      )}
                      <Link href={`/company/tasks/${params.id}/submissions/${sub.id}`}>
                        <Button size="sm" variant="secondary">Review</Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'participants' && (
          <div className="space-y-4 animate-fade-up">
            {!Array.isArray(taskData.participations) || taskData.participations.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-text-muted text-sm">No participants yet.</p>
              </div>
            ) : (
              taskData.participations.map((p: any) => {
                const status = p.approved ? 'approved' : p.rejected ? 'rejected' : 'pending';
                const statusVariant = status === 'approved'
                  ? 'green'
                  : status === 'rejected'
                    ? 'red'
                    : 'amber';
                return (
                  <div
                    key={p.id}
                    className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center font-display font-bold text-bg-base text-xs bg-accent-cyan shrink-0"
                          aria-hidden="true"
                        >
                          {initials(p.engineerProfile?.fullName ?? 'Engineer')}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium text-text-primary truncate">
                              {p.engineerProfile?.fullName ?? 'Engineer'}
                            </p>
                            <Badge variant={statusVariant as any} className="capitalize">
                              {status}
                            </Badge>
                            {p.engineerProfile?.neuronTier && (
                              <Badge variant="gray" className="capitalize">
                                {p.engineerProfile.neuronTier}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-text-muted mt-1">
                            Score: <span className="font-mono text-text-secondary">{p.engineerProfile?.neuronScore ?? 0}</span>
                            {' · '}
                            Joined {new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] text-text-muted uppercase tracking-wide">Proposed Rate</p>
                        <p className="font-mono text-sm text-accent-amber">
                          {formatINR(p.proposedRate != null ? Number(p.proposedRate) : null)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid sm:grid-cols-3 gap-3 text-xs">
                      <div className="bg-bg-elevated rounded-lg p-3">
                        <p className="text-text-muted">Estimated Time</p>
                        <p className="text-text-primary font-mono mt-1">
                          {p.estimatedTime ? `${p.estimatedTime} days` : 'Not provided'}
                        </p>
                      </div>
                      <div className="bg-bg-elevated rounded-lg p-3 sm:col-span-2">
                        <p className="text-text-muted">Approach</p>
                        <p className="text-text-secondary mt-1 line-clamp-3">{p.approach}</p>
                      </div>
                    </div>
                    {!p.approved && !p.rejected && !isTaskFinalized && (
                      <div className="mt-4 flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => { void handleApproveParticipation(p.id); }}
                          disabled={updatingParticipant}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => {
                            setSelectedParticipationId(p.id);
                            setShowRejectModal(true);
                          }}
                          disabled={updatingParticipant}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
      <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Edit Task" size="lg">
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm text-text-secondary mb-1">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-lg px-3 py-2 text-sm text-text-primary"
            />
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1">Problem Statement</label>
            <textarea
              rows={4}
              value={problemStatement}
              onChange={(e) => setProblemStatement(e.target.value)}
              className="w-full bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-lg px-3 py-2 text-sm text-text-primary"
            />
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1">Expected Outcome</label>
            <textarea
              rows={3}
              value={expectedOutcome}
              onChange={(e) => setExpectedOutcome(e.target.value)}
              className="w-full bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-lg px-3 py-2 text-sm text-text-primary"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-text-secondary mb-1">Reward Amount</label>
              <input
                type="number"
                min={1000}
                value={rewardAmount}
                onChange={(e) => setRewardAmount(e.target.value)}
                className="w-full bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-lg px-3 py-2 text-sm text-text-primary"
              />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">Min NeuronScore</label>
              <input
                type="number"
                min={0}
                max={1000}
                value={minNeuronScore}
                onChange={(e) => setMinNeuronScore(e.target.value)}
                className="w-full bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-lg px-3 py-2 text-sm text-text-primary"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button size="md" className="flex-1" onClick={() => { void handleSaveTask(); }} disabled={saving}>
              {saving ? 'Saving…' : 'Save Changes'}
            </Button>
            <Button variant="ghost" size="md" onClick={() => setShowEdit(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
      <Modal open={showCloseConfirm} onClose={() => setShowCloseConfirm(false)} title="Close Task" size="md">
        <div className="p-6 space-y-4">
          <p className="text-sm text-text-secondary">
            Closing this task marks it as cancelled and removes it from active listings. This action cannot be undone from the UI.
          </p>
          <div className="flex gap-3 pt-2">
            <Button
              variant="danger"
              size="md"
              className="flex-1"
              onClick={() => { void handleCloseTask(); }}
              disabled={closing}
            >
              {closing ? 'Closing…' : 'Confirm Close'}
            </Button>
            <Button variant="ghost" size="md" onClick={() => setShowCloseConfirm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
      <Modal open={showRejectModal} onClose={() => setShowRejectModal(false)} title="Reject Participant" size="md">
        <div className="p-6 space-y-4">
          <p className="text-sm text-text-secondary">
            Add an optional reason to help the engineer understand the rejection.
          </p>
          <textarea
            rows={4}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Reason (optional)"
            className="w-full bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-lg px-3 py-2 text-sm text-text-primary"
          />
          <div className="flex gap-3 pt-2">
            <Button
              variant="danger"
              size="md"
              className="flex-1"
              onClick={() => { void handleRejectParticipation(); }}
              disabled={updatingParticipant}
            >
              {updatingParticipant ? 'Rejecting…' : 'Confirm Reject'}
            </Button>
            <Button variant="ghost" size="md" onClick={() => setShowRejectModal(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
