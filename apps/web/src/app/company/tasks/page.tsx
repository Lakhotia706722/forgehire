'use client';

import * as React from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const MOCK_TASKS = [
  {
    id: 't1',
    title: 'Multilingual Voice AI Agent for Customer Support',
    type: 'bounty',
    status: 'open',
    rewardAmount: 150000,
    deadline: '2026-05-20',
    participantCount: 12,
    submissionCount: 3,
    difficulty: 'Expert',
  },
  {
    id: 't2',
    title: 'Fraud Detection System Using Graph Neural Networks',
    type: 'contest',
    status: 'in_progress',
    rewardAmount: 200000,
    deadline: '2026-05-15',
    participantCount: 8,
    submissionCount: 5,
    difficulty: 'Expert',
  },
  {
    id: 't3',
    title: 'Internal RAG Pipeline for Document Intelligence',
    type: 'direct',
    status: 'completed',
    rewardAmount: 80000,
    deadline: '2026-04-30',
    participantCount: 1,
    submissionCount: 1,
    difficulty: 'Hard',
  },
  {
    id: 't4',
    title: 'LLM-powered Code Review Automation',
    type: 'bounty',
    status: 'draft',
    rewardAmount: 120000,
    deadline: '2026-06-01',
    participantCount: 0,
    submissionCount: 0,
    difficulty: 'Hard',
  },
];

const STATUS_CONFIG: Record<string, { variant: 'cyan' | 'green' | 'amber' | 'red' | 'gray'; label: string }> = {
  draft:       { variant: 'gray',  label: 'Draft' },
  open:        { variant: 'cyan',  label: 'Open' },
  in_progress: { variant: 'amber', label: 'In Progress' },
  in_review:   { variant: 'violet' as any, label: 'In Review' },
  completed:   { variant: 'green', label: 'Completed' },
  cancelled:   { variant: 'red',   label: 'Cancelled' },
};

const TYPE_LABEL: Record<string, string> = {
  bounty:  'Bounty',
  contest: 'Contest',
  direct:  'Direct',
};

export default function CompanyTasksPage() {
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<'all' | 'open' | 'in_progress' | 'completed' | 'draft'>('all');

  React.useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  const filtered = MOCK_TASKS.filter((t) => filter === 'all' || t.status === filter);

  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-text-primary">My Tasks</h1>
            <p className="text-text-secondary text-sm mt-1">Manage your posted bounties and tasks</p>
          </div>
          <Link href="/company/post-task">
            <Button size="md">+ Post Task</Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Tasks',   value: MOCK_TASKS.length,                                    color: '#00D4FF' },
            { label: 'Active',        value: MOCK_TASKS.filter((t) => t.status === 'open').length, color: '#10B981' },
            { label: 'Participants',  value: MOCK_TASKS.reduce((s, t) => s + t.participantCount, 0), color: '#7B5EA7' },
            { label: 'Submissions',   value: MOCK_TASKS.reduce((s, t) => s + t.submissionCount, 0), color: '#F59E0B' },
          ].map((s) => (
            <div key={s.label} className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl p-4 text-center">
              <p className="font-mono font-bold text-2xl" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs text-text-muted mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 border-b border-[rgba(255,255,255,0.06)]">
          {(['all', 'open', 'in_progress', 'completed', 'draft'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-4 py-2.5 text-sm font-medium transition-all relative',
                filter === f ? 'text-text-primary' : 'text-text-muted hover:text-text-secondary'
              )}
            >
              {f === 'all' ? 'All' : f === 'in_progress' ? 'In Progress' : f.charAt(0).toUpperCase() + f.slice(1)}
              {filter === f && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-cyan rounded-full" />}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-64" />
                  <Skeleton rounded className="h-5 w-16" />
                </div>
                <div className="flex gap-4">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-text-muted text-sm">No tasks found.</p>
            <Link href="/company/post-task" className="mt-3 inline-block text-sm text-accent-cyan hover:underline">
              Post your first task →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((task) => {
              const statusConfig = STATUS_CONFIG[task.status] ?? STATUS_CONFIG.draft;
              return (
                <Link
                  key={task.id}
                  href={`/company/tasks/${task.id}`}
                  className="block bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl p-5 hover:border-[rgba(123,94,167,0.3)] hover:-translate-y-0.5 transition-all duration-200"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                    <p className="font-display font-semibold text-text-primary text-sm">{task.title}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="gray">{TYPE_LABEL[task.type]}</Badge>
                      <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-6 text-xs text-text-muted">
                    <span>Reward: <span className="text-accent-amber font-mono font-semibold">₹{task.rewardAmount.toLocaleString('en-IN')}</span></span>
                    <span>Deadline: {new Date(task.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                    <span>{task.participantCount} participants</span>
                    <span>{task.submissionCount} submissions</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
