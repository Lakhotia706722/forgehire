'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { CompanyProfile } from '@/lib/mock-data';

type TabId = 'jobs' | 'bounties' | 'projects' | 'reviews' | 'team';

const TABS: { id: TabId; label: string }[] = [
  { id: 'jobs',     label: 'Open Jobs' },
  { id: 'bounties', label: 'Open Bounties' },
  { id: 'projects', label: 'Past Projects' },
  { id: 'reviews',  label: 'Reviews' },
  { id: 'team',     label: 'Team' },
];

interface CompanyContentProps {
  company: CompanyProfile;
}

export function CompanyContent({ company: co }: CompanyContentProps) {
  const [activeTab, setActiveTab] = React.useState<TabId>('jobs');
  const tabRefs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const [underlineStyle, setUnderlineStyle] = React.useState({ left: 0, width: 0 });

  React.useEffect(() => {
    const idx = TABS.findIndex((t) => t.id === activeTab);
    const el = tabRefs.current[idx];
    if (!el) return;
    const parent = el.parentElement;
    if (!parent) return;
    const pr = parent.getBoundingClientRect();
    const er = el.getBoundingClientRect();
    setUnderlineStyle({ left: er.left - pr.left, width: er.width });
  }, [activeTab]);

  return (
    <>
      {/* Tab bar */}
      <div
        className="sticky-tabs"
        role="tablist"
        aria-label="Company profile sections"
      >
        <div className="max-w-5xl mx-auto px-6">
          <div className="relative flex gap-0 overflow-x-auto">
            {TABS.map((tab, i) => (
              <button
                key={tab.id}
                ref={(el) => { tabRefs.current[i] = el; }}
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'px-4 py-4 text-sm font-medium whitespace-nowrap transition-colors duration-200',
                  activeTab === tab.id ? 'text-text-primary' : 'text-text-muted hover:text-text-secondary'
                )}
              >
                {tab.label}
              </button>
            ))}
            <div
              className="absolute bottom-0 h-0.5 bg-accent-cyan rounded-full transition-all duration-300"
              style={{ left: underlineStyle.left, width: underlineStyle.width, transitionTimingFunction: 'cubic-bezier(0.16,1,0.3,1)' }}
              aria-hidden="true"
            />
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div key={activeTab} className="animate-fade-up" role="tabpanel">
          {activeTab === 'jobs'     && <OpenJobsTab     jobs={co.openJobs} />}
          {activeTab === 'bounties' && <OpenBountiesTab bounties={co.openBounties} />}
          {activeTab === 'projects' && <PastProjectsTab projects={co.pastProjects} />}
          {activeTab === 'reviews'  && <CompanyReviewsTab reviews={co.reviews} />}
          {activeTab === 'team'     && <TeamTab />}
        </div>
      </div>
    </>
  );
}

function OpenJobsTab({ jobs }: { jobs: CompanyProfile['openJobs'] }) {
  return (
    <div className="space-y-4">
      {jobs.map((job) => (
        <div key={job.id} className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl p-5 hover:border-[rgba(0,212,255,0.2)] transition-colors">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
            <div>
              <h3 className="font-display font-semibold text-text-primary text-sm">{job.title}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="cyan" className="text-[10px]">{job.mode}</Badge>
                <span className="text-xs text-text-muted font-mono">{job.postedAt}</span>
              </div>
            </div>
            <span className="font-mono font-semibold text-accent-cyan text-sm">{job.budget}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {job.skills.map((s) => (
              <Badge key={s} variant="gray" className="text-[10px]">{s}</Badge>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function OpenBountiesTab({ bounties }: { bounties: CompanyProfile['openBounties'] }) {
  return (
    <div className="space-y-4">
      {bounties.map((b) => (
        <div key={b.id} className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl p-5 hover:border-[rgba(245,158,11,0.2)] transition-colors">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-display font-semibold text-text-primary text-sm mb-1">{b.title}</h3>
              <div className="flex items-center gap-2">
                <Badge variant="amber" className="text-[10px]">{b.difficulty}</Badge>
                <span className="text-xs text-text-muted font-mono">{b.deadline} left</span>
              </div>
            </div>
            <p className="font-display font-bold text-accent-amber text-xl">{b.reward}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function PastProjectsTab({ projects }: { projects: CompanyProfile['pastProjects'] }) {
  return (
    <div className="space-y-4">
      {projects.map((p) => (
        <div key={p.id} className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl p-5">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
            <h3 className="font-display font-semibold text-text-primary text-sm">{p.title}</h3>
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map((s) => (
                <svg key={s} width="11" height="11" viewBox="0 0 12 12" fill={s <= p.rating ? '#F59E0B' : 'rgba(255,255,255,0.1)'} aria-hidden="true">
                  <path d="M6 1l1.39 2.82L10.5 4.27l-2.25 2.19.53 3.09L6 8.02 3.22 9.55l.53-3.09L1.5 4.27l3.11-.45L6 1z"/>
                </svg>
              ))}
            </div>
          </div>
          <p className="text-xs text-text-muted mb-1">Engineer: <span className="text-text-secondary">{p.engineerName}</span> · {p.completedAt}</p>
          <p className="text-xs text-accent-green">{p.outcome}</p>
        </div>
      ))}
    </div>
  );
}

function CompanyReviewsTab({ reviews }: { reviews: CompanyProfile['reviews'] }) {
  return (
    <div className="space-y-4">
      {reviews.map((r) => (
        <div key={r.id} className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl p-5">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-bg-elevated border border-[rgba(255,255,255,0.08)] flex items-center justify-center font-display font-bold text-xs text-text-secondary shrink-0">
              {r.engineerInitials}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-text-primary">{r.engineerName}</p>
                <div className="flex items-center gap-0.5">
                  {[1,2,3,4,5].map((s) => (
                    <svg key={s} width="11" height="11" viewBox="0 0 12 12" fill={s <= r.rating ? '#F59E0B' : 'rgba(255,255,255,0.1)'} aria-hidden="true">
                      <path d="M6 1l1.39 2.82L10.5 4.27l-2.25 2.19.53 3.09L6 8.02 3.22 9.55l.53-3.09L1.5 4.27l3.11-.45L6 1z"/>
                    </svg>
                  ))}
                </div>
              </div>
              <p className="text-xs text-text-muted font-mono">{r.date}</p>
            </div>
          </div>
          <p className="text-text-secondary text-sm leading-relaxed">{r.text}</p>
        </div>
      ))}
    </div>
  );
}

function TeamTab() {
  return (
    <div className="text-center py-16 text-text-muted">
      <p className="text-sm">Team information is not publicly available.</p>
    </div>
  );
}
