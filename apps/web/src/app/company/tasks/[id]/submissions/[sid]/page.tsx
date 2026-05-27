'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useSubmissionDetail, useApproveSubmission, useRejectSubmission } from '@/lib/api-hooks';

export default function SubmissionDetailPage({ params }: { params: { id: string; sid: string } }) {
  const { data: submission, isLoading, error } = useSubmissionDetail(params.id, params.sid);
  const approve = useApproveSubmission(params.id);
  const reject = useRejectSubmission(params.id);
  const [feedback, setFeedback] = React.useState('');

  async function handleApprove() {
    try {
      await approve.mutateAsync(params.sid);
      toast.success('Submission approved! Payout initiated.');
    } catch (e: any) {
      toast.error(e.message || 'Failed to approve submission');
    }
  }

  async function handleReject() {
    if (!feedback.trim()) { toast.error('Please provide feedback before rejecting'); return; }
    try {
      await reject.mutateAsync({ submissionId: params.sid, feedback });
      toast.success('Submission rejected with feedback sent to engineer.');
    } catch (e: any) {
      toast.error(e.message || 'Failed to reject submission');
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
  const metrics = submission.performanceMetrics as { metric: string; value: string }[] | null;

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
              <Badge variant="amber">Under Review</Badge>
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
          </div>
        </div>

        {/* Performance metrics */}
        {metrics && metrics.length > 0 && (
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
        <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 space-y-4">
          <h2 className="font-display font-semibold text-text-primary text-lg">Review Decision</h2>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Feedback (required for rejection)</label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={3}
              placeholder="Provide constructive feedback to the engineer..."
              className="w-full bg-bg-elevated border border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,212,255,0.3)] resize-none transition-all"
            />
          </div>

          <div className="flex gap-3">
            <Button className="flex-1" size="lg" loading={approve.isPending} onClick={handleApprove}>
              ✓ Approve &amp; Release Payment
            </Button>
            <Button variant="danger" size="lg" loading={reject.isPending} onClick={handleReject}>
              Reject
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
