'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  useSubmissionDetail,
  useApproveSubmission,
  useRejectSubmission,
  useEvaluateSubmission,
} from '@/lib/api-hooks';
import { ApiRequestError } from '@/lib/api-fetch';

export default function SubmissionDetailPage({ params }: { params: { id: string; sid: string } }) {
  const router = useRouter();
  const { data: submission, isLoading, error } = useSubmissionDetail(params.id, params.sid);
  const approve = useApproveSubmission(params.id);
  const reject = useRejectSubmission(params.id);
  const evaluate = useEvaluateSubmission(params.id);
  const [feedback, setFeedback] = React.useState('');
  const [reviewScore, setReviewScore] = React.useState(75);
  const [criteriaScores, setCriteriaScores] = React.useState({
    accuracy: 75,
    performance: 75,
    innovation: 75,
    codeQuality: 75,
    ux: 75,
  });
  const isDecisionPending = approve.isPending || reject.isPending || evaluate.isPending;

  function getDecisionError(err: unknown, fallback: string): string {
    if (err instanceof ApiRequestError && err.status === 409) return err.message;
    if (err instanceof Error && err.message) return err.message;
    return fallback;
  }

  React.useEffect(() => {
    if (submission?.score != null) {
      setReviewScore(submission.score);
    }
    if (submission?.criteriaScores) {
      setCriteriaScores((prev) => ({ ...prev, ...submission.criteriaScores }));
    }
  }, [submission?.score, submission?.criteriaScores]);

  async function handleApprove() {
    if (isDecisionPending) return;
    try {
      await approve.mutateAsync(params.sid);
      toast.success('Submission approved! Payout initiated.');
      router.push(`/company/tasks/${params.id}/submissions`);
    } catch (e: any) {
      toast.error(getDecisionError(e, 'Failed to approve submission'));
    }
  }

  async function handleReject() {
    if (isDecisionPending) return;
    if (!feedback.trim()) { toast.error('Please provide feedback before rejecting'); return; }
    try {
      await reject.mutateAsync({ submissionId: params.sid, feedback });
      toast.success('Submission rejected with feedback sent to engineer.');
      router.push(`/company/tasks/${params.id}/submissions`);
    } catch (e: any) {
      toast.error(getDecisionError(e, 'Failed to reject submission'));
    }
  }

  async function handleRequestChanges() {
    if (isDecisionPending) return;
    if (feedback.trim().length < 10) {
      toast.error('Please provide at least 10 characters of feedback');
      return;
    }
    try {
      await evaluate.mutateAsync({
        submissionId: params.sid,
        score: Math.max(0, Math.min(100, Number(reviewScore))),
        feedback: feedback.trim(),
      });
      toast.success('Review saved. Submission marked under review.');
      router.push(`/company/tasks/${params.id}/submissions`);
    } catch (e: any) {
      toast.error(getDecisionError(e, 'Failed to save review'));
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-base">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 space-y-6">
          <Skeleton className="h-4 w-64" />
          <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <Skeleton circle className="w-12 h-12" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </div>
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-muted">Failed to load submission</p>
          <Link href={`/company/tasks/${params.id}/submissions`} className="mt-4 text-accent-cyan hover:underline text-sm block">
            ← Back to submissions
          </Link>
        </div>
      </div>
    );
  }

  const initials = submission.engineerName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const rawMetrics = submission.performanceMetrics as
    | { metric: string; value: string }[]
    | Record<string, unknown>
    | null;
  const metrics: { metric: string; value: string }[] = Array.isArray(rawMetrics)
    ? rawMetrics
        .filter((m) => m && typeof m.metric === 'string')
        .map((m) => ({ metric: m.metric, value: String(m.value ?? '') }))
    : rawMetrics && typeof rawMetrics === 'object'
      ? Object.entries(rawMetrics).map(([metric, value]) => ({
          metric,
          value: String(value ?? ''),
        }))
      : [];
  const status = (submission.status ?? 'pending').toLowerCase();
  const isFinalized = ['accepted', 'rejected', 'winner'].includes(status);
  const statusVariant =
    status === 'accepted' || status === 'winner'
      ? 'green'
      : status === 'rejected'
        ? 'red'
        : 'amber';
  const statusLabel =
    status === 'accepted'
      ? 'Approved'
      : status === 'winner'
        ? 'Winner'
        : status === 'rejected'
          ? 'Rejected'
          : 'Under Review';

  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-text-muted flex-wrap">
          <Link href="/company/tasks" className="hover:text-text-secondary">Tasks</Link>
          <span>/</span>
          <Link href={`/company/tasks/${params.id}`} className="hover:text-text-secondary">Task</Link>
          <span>/</span>
          <Link href={`/company/tasks/${params.id}/submissions`} className="hover:text-text-secondary">Submissions</Link>
          <span>/</span>
          <span className="text-text-secondary">{submission.engineerName}</span>
        </div>

        {/* Engineer header */}
        <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center font-display font-bold text-bg-base bg-[#F59E0B]"
                aria-hidden="true"
              >
                {initials}
              </div>
              <div>
                <p className="font-display font-semibold text-text-primary">{submission.engineerName}</p>
                <p className="text-xs text-text-muted">
                  Submitted {new Date(submission.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                <p className="text-xs text-text-muted">NeuronScore: {submission.neuronScore}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {submission.score !== null && (
                <span className="font-mono text-2xl font-bold text-accent-cyan">
                  {submission.score}<span className="text-sm text-text-muted">/100</span>
                </span>
              )}
              <Badge variant={statusVariant as any}>{statusLabel}</Badge>
            </div>
          </div>
        </div>

        {/* Submission content */}
        <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 space-y-4">
          <h2 className="font-display font-semibold text-text-primary text-lg">Submission Details</h2>
          <p className="text-sm text-text-secondary leading-relaxed">{submission.description}</p>

          <div className="flex gap-3">
            {submission.demoUrl && (
              <a href={submission.demoUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="secondary" size="sm">🔗 View Demo</Button>
              </a>
            )}
            {submission.githubUrl && (
              <a href={submission.githubUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="sm">GitHub →</Button>
              </a>
            )}
            {submission.videoUrl && (
              <a href={submission.videoUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="sm">Video ↗</Button>
              </a>
            )}
            {submission.architectureDiagram && (
              <a href={submission.architectureDiagram} target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="sm">Architecture ↗</Button>
              </a>
            )}
          </div>

          {submission.status === 'rejected' && submission.feedback && (
            <div className="mt-2 rounded-xl border border-[rgba(239,68,68,0.25)] bg-[rgba(239,68,68,0.08)] p-4">
              <p className="text-xs uppercase tracking-wide text-red-300 mb-1">Rejection Feedback</p>
              <p className="text-sm text-red-200 leading-relaxed">{submission.feedback}</p>
            </div>
          )}
        </div>

        {/* Performance metrics */}
        {metrics.length > 0 && (
          <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
            <h2 className="font-display font-semibold text-text-primary text-lg mb-4">Performance Metrics</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {metrics.map((m) => (
                <div key={m.metric} className="bg-bg-elevated rounded-xl p-3 text-center">
                  <p className="font-mono font-bold text-accent-cyan">{m.value}</p>
                  <p className="text-xs text-text-muted mt-0.5">{m.metric}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Screenshots */}
        {submission.screenshots && submission.screenshots.length > 0 && (
          <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
            <h2 className="font-display font-semibold text-text-primary text-lg mb-4">Screenshots</h2>
            <div className="grid grid-cols-2 gap-3">
              {submission.screenshots.map((url, i) => (
                <Image
                  key={i}
                  src={url}
                  alt={`Screenshot ${i + 1}`}
                  width={640}
                  height={360}
                  unoptimized
                  className="w-full rounded-lg object-cover"
                />
              ))}
            </div>
          </div>
        )}

        {/* Review actions */}
        {!isFinalized && (
          <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 space-y-4">
            <h2 className="font-display font-semibold text-text-primary text-lg">Review Decision</h2>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Feedback (required for rejection)</label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={3}
                placeholder="Provide constructive feedback to the engineer..."
                disabled={isDecisionPending}
                className="w-full bg-bg-elevated border border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,212,255,0.3)] resize-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Review Score (0-100)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={reviewScore}
                onChange={(e) => setReviewScore(Number(e.target.value))}
                disabled={isDecisionPending}
                className="w-full bg-bg-elevated border border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-[rgba(0,212,255,0.3)]"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                ['accuracy', 'Accuracy'],
                ['performance', 'Performance'],
                ['innovation', 'Innovation'],
                ['codeQuality', 'Code Quality'],
                ['ux', 'UI/UX'],
              ].map(([key, label]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-text-secondary mb-2">{label} (0-100)</label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={criteriaScores[key as keyof typeof criteriaScores]}
                    onChange={(e) =>
                      setCriteriaScores((prev) => ({
                        ...prev,
                        [key]: Number(e.target.value),
                      }))
                    }
                    disabled={isDecisionPending}
                    className="w-full accent-accent-cyan"
                  />
                  <p className="text-xs text-text-muted mt-1">
                    {criteriaScores[key as keyof typeof criteriaScores]}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button className="flex-1" size="lg" loading={approve.isPending} disabled={isDecisionPending} onClick={handleApprove}>
                ✓ Approve &amp; Release Payment
              </Button>
              <Button variant="secondary" size="lg" loading={evaluate.isPending} disabled={isDecisionPending} onClick={handleRequestChanges}>
                Need Changes
              </Button>
              <Button variant="danger" size="lg" loading={reject.isPending} disabled={isDecisionPending} onClick={handleReject}>
                Reject
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
