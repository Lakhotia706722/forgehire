'use client';

import * as React from 'react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  useCompanyDashboard,
  usePendingSubmissions,
  type PendingSubmission,
} from '@/lib/api-hooks';
import { useUser } from '@clerk/nextjs';

function StatCard({
  label,
  value,
  valueClass,
  loading,
}: {
  label: string;
  value: string;
  valueClass: string;
  loading: boolean;
}) {
  return (
    <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl p-5">
      <p className="text-xs text-text-muted mb-2">{label}</p>
      {loading ? (
        <Skeleton className="h-8 w-20" />
      ) : (
        <p className={cn('text-2xl font-display font-bold', valueClass)}>{value}</p>
      )}
    </div>
  );
}

function SubmissionRow({ sub }: { sub: PendingSubmission }) {
  return (
    <Link
      href={`/company/tasks/${sub.taskId}`}
      className="flex items-center justify-between p-4 bg-bg-elevated hover:bg-[rgba(255,255,255,0.04)] rounded-xl border border-[rgba(255,255,255,0.04)] transition-colors group"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-text-primary truncate group-hover:text-accent-cyan transition-colors">
          {sub.taskTitle}
        </p>
        <p className="text-xs text-text-muted mt-0.5">
          {sub.engineerName} &middot; Score: <span className="text-accent-cyan font-mono">{sub.engineerScore}</span>
        </p>
      </div>
      <div className="ml-4 flex items-center gap-2 shrink-0">
        <Badge variant="amber" className="text-[10px]">Pending Review</Badge>
        <span className="text-text-muted text-xs hidden sm:block">
          {new Date(sub.submittedAt).toLocaleDateString('en-IN')}
        </span>
      </div>
    </Link>
  );
}

export default function CompanyDashboardPage() {
  const { user } = useUser();
  const companyName = user?.organizationMemberships?.[0]?.organization?.name
    || user?.firstName
    || 'there';

  const { data: stats, isLoading: statsLoading, isError: statsError } = useCompanyDashboard();
  const { data: submissions, isLoading: subsLoading, isError: subsError } = usePendingSubmissions(8);

  const statCards = [
    {
      label: 'Tasks Posted',
      value: String(stats?.activeTasksPosted ?? 0),
      valueClass: 'text-accent-cyan',
    },
    {
      label: 'Engineers Hired',
      value: String(stats?.totalEngineersHired ?? 0),
      valueClass: 'text-accent-violet',
    },
    {
      label: 'Spend This Month',
      value: stats ? `₹${(stats.totalSpendThisMonth / 1000).toFixed(0)}K` : '₹0',
      valueClass: 'text-accent-amber',
    },
    {
      label: 'Open Disputes',
      value: String(stats?.openDisputes ?? 0),
      valueClass: stats?.openDisputes ? 'text-red-400' : 'text-text-secondary',
    },
  ];

  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">

        {/* Welcome banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-text-primary">
              Welcome back, {companyName}. 👋
            </h1>
            <p className="text-text-secondary text-sm mt-1">
              Manage your hiring pipeline and AI engineering tasks.
            </p>
          </div>
          <Link href="/company/post-task">
            <Button size="md" className="shrink-0">
              + Post a Task
            </Button>
          </Link>
        </div>

        {/* Stat cards */}
        {statsError ? (
          <div className="bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.25)] rounded-xl p-4 text-sm text-red-400">
            Could not load dashboard stats. Please refresh or check your connection.
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((c) => (
              <StatCard
                key={c.label}
                label={c.label}
                value={c.value}
                valueClass={c.valueClass}
                loading={statsLoading}
              />
            ))}
          </div>
        )}

        {/* Quick actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Post a Task',    href: '/company/post-task',  icon: '📋' },
            { label: 'Browse Engineers', href: '/engineers',        icon: '🔍' },
            { label: 'My Contracts',   href: '/company/contracts',  icon: '🤝' },
            { label: 'Analytics',      href: '/company/analytics',  icon: '📊' },
          ].map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="flex flex-col items-center gap-2 p-4 bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl hover:border-[rgba(0,212,255,0.2)] hover:bg-[rgba(0,212,255,0.03)] transition-all text-center"
            >
              <span className="text-2xl" aria-hidden="true">{action.icon}</span>
              <span className="text-xs font-medium text-text-secondary">{action.label}</span>
            </Link>
          ))}
        </div>

        {/* Pending submissions */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold text-text-primary">Pending Submissions</h2>
            <Link href="/company/tasks" className="text-xs text-accent-cyan hover:underline">
              View all tasks →
            </Link>
          </div>

          {subsError ? (
            <div className="bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.25)] rounded-xl p-4 text-sm text-red-400">
              Could not load pending submissions.
            </div>
          ) : subsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : submissions && submissions.length > 0 ? (
            <div className="space-y-2">
              {submissions.map((sub) => (
                <SubmissionRow key={sub.id} sub={sub} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl">
              <span className="text-3xl mb-3" aria-hidden="true">📭</span>
              <p className="text-sm text-text-secondary">No pending submissions</p>
              <p className="text-xs text-text-muted mt-1">Post a task to start receiving proposals.</p>
              <Link href="/company/post-task" className="mt-4">
                <Button size="sm" variant="secondary">Post your first task</Button>
              </Link>
            </div>
          )}
        </section>

        {/* Active contracts */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold text-text-primary">Active Contracts</h2>
            <Link href="/company/contracts" className="text-xs text-accent-cyan hover:underline">
              View contracts →
            </Link>
          </div>
          {Array.isArray(stats?.activeContracts) && stats.activeContracts.length > 0 ? (
            <div className="space-y-2">
              {stats.activeContracts.slice(0, 4).map((contract) => (
                <div
                  key={contract.id}
                  className="p-4 bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm text-text-primary font-medium">{contract.title}</p>
                    <p className="text-xs text-text-muted capitalize">{contract.status}</p>
                  </div>
                  <p className="text-sm font-mono text-accent-green">₹{contract.totalAmount.toLocaleString('en-IN')}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl text-sm text-text-muted">
              No active contracts yet.
            </div>
          )}
        </section>

        {/* Recommended engineers */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold text-text-primary">Recommended Engineers</h2>
            <Link href="/company/browse" className="text-xs text-accent-cyan hover:underline">
              Browse all →
            </Link>
          </div>
          {stats?.recommendedEngineers && stats.recommendedEngineers.length > 0 ? (
            <div className="grid sm:grid-cols-2 gap-3">
              {stats.recommendedEngineers.slice(0, 4).map((engineer) => (
                <div
                  key={engineer.id}
                  className="p-4 bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl"
                >
                  <p className="text-sm font-medium text-text-primary">{engineer.fullName}</p>
                  <p className="text-xs text-text-muted mt-0.5 truncate">{engineer.headline || 'AI Engineer'}</p>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-accent-cyan font-mono">Score {engineer.neuronScore}</span>
                    <span className="text-text-secondary">₹{engineer.hourlyRate}/hr</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl text-sm text-text-muted">
              No recommendations available yet.
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
