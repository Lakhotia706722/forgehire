'use client';

import * as React from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const MOCK_TASK = {
  id: 't1',
  title: 'Multilingual Voice AI Agent for Customer Support',
  type: 'bounty',
  status: 'open',
  rewardAmount: 150000,
  deadline: '2026-05-20',
  difficulty: 'Expert',
  problemStatement: 'Build a production-ready multilingual voice AI agent that can handle customer support queries in Hindi, Tamil, Telugu, and English.',
  expectedOutcome: 'A deployable voice AI agent with <200ms latency, 95%+ accuracy, and support for 4 Indian languages.',
  techRequirements: ['LangChain', 'Whisper', 'FastAPI', 'WebRTC', 'Redis'],
  participantCount: 12,
  submissionCount: 3,
  escrowDeposited: true,
  ndaRequired: true,
  minNeuronScore: 700,
};

const MOCK_SUBMISSIONS = [
  { id: 's1', engineerName: 'Arjun Sharma', initials: 'AS', color: '#F59E0B', score: 88, status: 'under_review', submittedAt: '2026-05-10' },
  { id: 's2', engineerName: 'Priya Menon',  initials: 'PM', color: '#00D4FF', score: 82, status: 'under_review', submittedAt: '2026-05-11' },
  { id: 's3', engineerName: 'Rahul Kumar',  initials: 'RK', color: '#7B5EA7', score: 75, status: 'pending',      submittedAt: '2026-05-12' },
];

export default function CompanyTaskDetailPage({ params }: { params: { id: string } }) {
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<'overview' | 'submissions' | 'participants'>('overview');

  React.useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  if (loading) {
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

  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <Link href="/company/tasks" className="hover:text-text-secondary transition-colors">Tasks</Link>
          <span>/</span>
          <span className="text-text-secondary truncate">{MOCK_TASK.title}</span>
        </div>

        {/* Header */}
        <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="cyan">Open</Badge>
                <Badge variant="gray">{MOCK_TASK.type}</Badge>
                {MOCK_TASK.ndaRequired && <Badge variant="amber">NDA Required</Badge>}
              </div>
              <h1 className="font-display font-bold text-xl text-text-primary">{MOCK_TASK.title}</h1>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm">Edit Task</Button>
              <Button variant="danger" size="sm">Close Task</Button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Reward',       value: `₹${MOCK_TASK.rewardAmount.toLocaleString('en-IN')}`, color: '#F59E0B' },
              { label: 'Participants', value: MOCK_TASK.participantCount,                            color: '#00D4FF' },
              { label: 'Submissions',  value: MOCK_TASK.submissionCount,                             color: '#7B5EA7' },
              { label: 'Min Score',    value: MOCK_TASK.minNeuronScore,                              color: '#10B981' },
            ].map((stat) => (
              <div key={stat.label} className="bg-bg-elevated rounded-xl p-3 text-center">
                <p className="font-mono font-bold text-lg" style={{ color: stat.color }}>{stat.value}</p>
                <p className="text-xs text-text-muted mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
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
              {tab === 'submissions' && MOCK_TASK.submissionCount > 0 && (
                <span className="ml-1.5 text-[10px] font-mono bg-accent-cyan text-bg-base px-1.5 py-0.5 rounded-full">
                  {MOCK_TASK.submissionCount}
                </span>
              )}
              {activeTab === tab && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-cyan rounded-full" />}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'overview' && (
          <div className="space-y-5 animate-fade-up">
            <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 space-y-4">
              <div>
                <h3 className="text-sm font-medium text-text-secondary mb-2">Problem Statement</h3>
                <p className="text-sm text-text-primary leading-relaxed">{MOCK_TASK.problemStatement}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-text-secondary mb-2">Expected Outcome</h3>
                <p className="text-sm text-text-primary leading-relaxed">{MOCK_TASK.expectedOutcome}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-text-secondary mb-2">Tech Requirements</h3>
                <div className="flex flex-wrap gap-2">
                  {MOCK_TASK.techRequirements.map((tech) => (
                    <Badge key={tech} variant="gray">{tech}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'submissions' && (
          <div className="space-y-4 animate-fade-up">
            {MOCK_SUBMISSIONS.map((sub) => (
              <div key={sub.id} className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center font-display font-bold text-bg-base text-xs"
                      style={{ background: sub.color }}
                      aria-hidden="true"
                    >
                      {sub.initials}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">{sub.engineerName}</p>
                      <p className="text-xs text-text-muted">Submitted {new Date(sub.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-bold text-accent-cyan">{sub.score}/100</span>
                    <Link href={`/company/tasks/${params.id}/submissions/${sub.id}`}>
                      <Button size="sm" variant="secondary">Review</Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'participants' && (
          <div className="text-center py-12 animate-fade-up">
            <p className="text-text-muted text-sm">{MOCK_TASK.participantCount} engineers have registered for this task.</p>
          </div>
        )}
      </div>
    </div>
  );
}
