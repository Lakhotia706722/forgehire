'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminEngineers, useAdminSuspendEngineer } from '@/lib/api-hooks';
import Link from 'next/link';

type EngineerStatus = 'active' | 'suspended' | 'pending_review';

export default function AdminEngineersPage() {
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<EngineerStatus | 'all'>('all');
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const suspend = useAdminSuspendEngineer();

  // Debounce search
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading } = useAdminEngineers({
    search: debouncedSearch || undefined,
    tier: statusFilter !== 'all' ? statusFilter : undefined,
  });

  const engineers = data?.engineers ?? [];
  const [suspendedIds, setSuspendedIds] = React.useState<Set<string>>(new Set());

  const filtered = engineers.filter((e) => {
    const effectiveStatus = suspendedIds.has(e.id) ? 'suspended' : e.status;
    if (statusFilter !== 'all' && effectiveStatus !== statusFilter) return false;
    // Client-side search filter (in addition to API search)
    if (search && !e.name.toLowerCase().includes(search.toLowerCase()) && !e.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((e) => e.id)));
    }
  }

  async function handleSuspend(id: string) {
    setSuspendedIds(prev => new Set([...prev, id]));
    await suspend.mutateAsync(id);
  }

  async function handleBulkSuspend() {
    const ids = [...selected];
    setSuspendedIds(prev => new Set([...prev, ...ids]));
    await Promise.all(ids.map(id => suspend.mutateAsync(id)));
    setSelected(new Set());
  }

  const statusBadge = (status: string) => {
    if (status === 'active') return <Badge variant="green">Active</Badge>;
    if (status === 'suspended') return <Badge variant="red">Suspended</Badge>;
    return <Badge variant="amber">Pending Review</Badge>;
  };

  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary mb-1">Engineer Management</h1>
          <p className="text-text-secondary text-sm">{data?.total ?? 0} engineers registered</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="flex-1 min-w-48 bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,212,255,0.3)]"
            aria-label="Search engineers"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as EngineerStatus | 'all')}
            className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-[rgba(0,212,255,0.3)] [color-scheme:dark]"
            aria-label="Filter by status"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="pending_review">Pending Review</option>
          </select>
        </div>

        {/* Bulk actions */}
        {selected.size > 0 && (
          <div className="flex items-center gap-3 p-3 bg-[rgba(0,212,255,0.06)] border border-[rgba(0,212,255,0.2)] rounded-xl" role="toolbar" aria-label="Bulk actions">
            <span className="text-sm text-accent-cyan">{selected.size} selected</span>
            <button onClick={handleBulkSuspend} className="px-3 py-1.5 rounded-lg bg-accent-red text-white text-xs font-semibold hover:brightness-110 transition-all">
              Suspend Selected
            </button>
            <button onClick={() => setSelected(new Set())} className="px-3 py-1.5 rounded-lg border border-[rgba(255,255,255,0.08)] text-text-secondary text-xs hover:text-text-primary transition-all">
              Clear
            </button>
          </div>
        )}

        {/* Table */}
        <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" aria-label="Engineers table">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.06)]">
                  <th className="py-3 px-4 text-left w-10">
                    <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleSelectAll} aria-label="Select all engineers" className="rounded" />
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-text-muted uppercase">Name</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-text-muted uppercase">Tier</th>
                  <th className="py-3 px-4 text-right text-xs font-medium text-text-muted uppercase">Score</th>
                  <th className="py-3 px-4 text-center text-xs font-medium text-text-muted uppercase">Status</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-text-muted uppercase">Joined</th>
                  <th className="py-3 px-4 text-center text-xs font-medium text-text-muted uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-[rgba(255,255,255,0.04)]">
                      <td className="py-3 px-4"><Skeleton className="h-4 w-4" /></td>
                      <td className="py-3 px-4"><Skeleton className="h-4 w-40" /></td>
                      <td className="py-3 px-4"><Skeleton className="h-5 w-20 rounded-full" /></td>
                      <td className="py-3 px-4 text-right"><Skeleton className="h-4 w-12 ml-auto" /></td>
                      <td className="py-3 px-4 text-center"><Skeleton className="h-5 w-16 rounded-full mx-auto" /></td>
                      <td className="py-3 px-4"><Skeleton className="h-4 w-24" /></td>
                      <td className="py-3 px-4"><Skeleton className="h-4 w-16 mx-auto" /></td>
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-text-muted text-sm">No engineers found</td>
                  </tr>
                ) : (
                  filtered.map((eng) => (
                    <tr key={eng.id} className={cn('border-b border-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.02)] transition-colors', eng.flagCount > 0 && 'bg-[rgba(245,158,11,0.03)]')}>
                      <td className="py-3 px-4">
                        <input type="checkbox" checked={selected.has(eng.id)} onChange={() => toggleSelect(eng.id)} aria-label={`Select ${eng.name}`} className="rounded" />
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-text-primary font-medium flex items-center gap-2">
                            {eng.name}
                            {eng.flagCount > 0 && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[rgba(245,158,11,0.1)] text-accent-amber border border-[rgba(245,158,11,0.2)]" aria-label={`${eng.flagCount} proctoring flags`}>
                                🚩 {eng.flagCount}
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-text-muted">{eng.email}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={eng.tier === 'elite' ? 'amber' : eng.tier === 'professional' ? 'cyan' : eng.tier === 'verified' ? 'violet' : 'gray'}>
                          {eng.tier}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-accent-cyan">{eng.neuronScore}</td>
                      <td className="py-3 px-4 text-center">{statusBadge(eng.status)}</td>
                      <td className="py-3 px-4 text-text-muted text-xs">
                        {new Date(eng.joinedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <Link href={`/admin/engineers/${eng.id}`} className="text-xs text-accent-cyan hover:underline">View</Link>
                          {eng.status !== 'suspended' && !suspendedIds.has(eng.id) && (
                            <button onClick={() => handleSuspend(eng.id)} className="text-xs text-accent-red hover:underline" aria-label={`Suspend ${eng.name}`} data-testid={`suspend-${eng.id}`}>
                              Suspend
                            </button>
                          )}
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
    </div>
  );
}
