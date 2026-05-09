'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { BountyFilters, DEFAULT_FILTERS, type FilterState } from './_components/bounty-filters';
import { BountyCard } from './_components/bounty-card';
import { NewBountyToast, useNewBountyNotifications } from './_components/new-bounty-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';

async function apiFetch<T>(path: string): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

const ENGINEER_SCORE = 920;
const ENGINEER_SKILLS = ['LangChain', 'PyTorch', 'FastAPI', 'LLM', 'RAG'];

export default function BountiesPage() {
  const [filters, setFilters] = React.useState<FilterState>(DEFAULT_FILTERS);
  const [applied, setApplied] = React.useState<FilterState>(DEFAULT_FILTERS);
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const { notification, dismiss } = useNewBountyNotifications(ENGINEER_SKILLS);

  const { data: tasksData, isLoading } = useQuery({
    queryKey: ['tasks', 'bounties', applied],
    queryFn: () => apiFetch<{ tasks: any[]; total: number }>('/api/tasks?status=open&limit=20'),
    staleTime: 60_000,
  });

  const allBounties = tasksData?.tasks ?? [];

  // Filter bounties client-side
  const filtered = React.useMemo(() => {
    return allBounties.filter((b) => {
      if (applied.search && !b.title.toLowerCase().includes(applied.search.toLowerCase()) &&
          !b.description.toLowerCase().includes(applied.search.toLowerCase())) return false;
      if (applied.types.length && !applied.types.includes(b.type)) return false;
      if (applied.difficulties.length && !applied.difficulties.includes(b.difficulty)) return false;
      if (b.reward < applied.rewardRange[0] || b.reward > applied.rewardRange[1]) return false;
      if (applied.skills.length && !applied.skills.some((s) => b.skills.includes(s))) return false;
      if (applied.eligibleOnly && ENGINEER_SCORE < b.minNeuronScore) return false;
      if (applied.deadline === 'this_week') {
        const diff = b.deadline.getTime() - Date.now();
        if (diff > 7 * 24 * 60 * 60 * 1000) return false;
      }
      if (applied.deadline === 'this_month') {
        const diff = b.deadline.getTime() - Date.now();
        if (diff > 30 * 24 * 60 * 60 * 1000) return false;
      }
      return true;
    });
  }, [applied]);

  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-text-primary">
              Bounty Board
            </h1>
            <p className="text-text-secondary text-sm mt-1">
              {isLoading ? '...' : `${filtered.length} open bounties matching your profile`}
            </p>
          </div>
          {/* Mobile filter toggle */}
          <button
            className="md:hidden flex items-center gap-2 px-3 py-2 rounded-lg border border-[rgba(255,255,255,0.08)] text-sm text-text-secondary"
            onClick={() => setSidebarOpen((o) => !o)}
            aria-expanded={sidebarOpen}
            aria-controls="filter-sidebar"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M2 4h12M4 8h8M6 12h4"/>
            </svg>
            Filters
          </button>
        </div>

        <div className="flex gap-8">
          {/* Filters sidebar */}
          <div
            id="filter-sidebar"
            className={cn(
              'w-72 shrink-0',
              // Desktop: always visible sticky
              'hidden md:block',
              // Mobile: overlay
              sidebarOpen && '!block fixed inset-0 z-40 bg-bg-base/95 overflow-y-auto p-6'
            )}
          >
            {sidebarOpen && (
              <button
                className="md:hidden mb-4 text-sm text-text-muted hover:text-text-secondary"
                onClick={() => setSidebarOpen(false)}
              >
                ← Close filters
              </button>
            )}
            <div className="md:sticky md:top-8">
              <BountyFilters
                filters={filters}
                onChange={setFilters}
                onApply={() => { setApplied(filters); setSidebarOpen(false); }}
                onReset={() => { setFilters(DEFAULT_FILTERS); setApplied(DEFAULT_FILTERS); }}
              />
            </div>
          </div>

          {/* Bounty grid */}
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <div className="grid sm:grid-cols-2 gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl p-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <Skeleton circle className="w-7 h-7" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-3 w-5/6" />
                    <Skeleton className="h-3 w-4/6" />
                    <div className="flex gap-1.5">
                      {[1,2,3].map((j) => <Skeleton key={j} rounded className="h-5 w-16" />)}
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <Skeleton className="h-5 w-20" />
                      <Skeleton rounded className="h-5 w-16" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-text-muted text-sm">No bounties match your filters.</p>
                <button
                  onClick={() => { setFilters(DEFAULT_FILTERS); setApplied(DEFAULT_FILTERS); }}
                  className="mt-3 text-sm text-accent-cyan hover:underline"
                >
                  Reset filters
                </button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-5" role="list" aria-label="Bounty listings">
                {filtered.map((b) => (
                  <div key={b.id} role="listitem">
                    <BountyCard bounty={b} engineerScore={ENGINEER_SCORE} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New bounty WebSocket notification */}
      <NewBountyToast notification={notification} onDismiss={dismiss} />
    </div>
  );
}
