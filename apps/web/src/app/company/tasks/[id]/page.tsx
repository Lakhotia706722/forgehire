'use client';

import * as React from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useTaskDetail, useTaskSubmissions } from '@/lib/api-hooks';

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
}

export default function CompanyTaskDetailPage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = React.useState<'overview' | 'submissions' | 'participants'>('overview');
  const { data: task, isLoading, isError } = useTaskDetail(params.id);
  const { data: submissions = [], isLoading: submissionsLoading } = useTaskSubmissions(params.id);

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
        </div>
      </div>
    );
  }

  const taskData = task as any;

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
              <Button variant="secondary" size="sm">Edit Task</Button>
              <Button variant="danger" size="sm">Close Task</Button>
            </div>
          </div>

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
          <div className="text-center py-12 animate-fade-up">
            <p className="text-text-muted text-sm">
              {taskData.participantCount ?? 0} engineers have registered for this task.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
