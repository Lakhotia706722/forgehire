'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export type TabId = 'projects' | 'experience' | 'tech-stack' | 'reviews' | 'marketplace' | 'activity';

const TABS: { id: TabId; label: string }[] = [
  { id: 'projects',     label: 'Projects' },
  { id: 'experience',   label: 'Experience' },
  { id: 'tech-stack',   label: 'Tech Stack' },
  { id: 'reviews',      label: 'Reviews' },
  { id: 'marketplace',  label: 'Marketplace' },
  { id: 'activity',     label: 'Activity' },
];

interface ProfileTabsProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function ProfileTabs({ activeTab, onTabChange }: ProfileTabsProps) {
  const tabRefs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const [underlineStyle, setUnderlineStyle] = React.useState({ left: 0, width: 0 });

  // Measure and position the sliding underline
  React.useEffect(() => {
    const idx = TABS.findIndex((t) => t.id === activeTab);
    const el = tabRefs.current[idx];
    if (!el) return;
    const parent = el.parentElement;
    if (!parent) return;
    const parentRect = parent.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    setUnderlineStyle({
      left: elRect.left - parentRect.left,
      width: elRect.width,
    });
  }, [activeTab]);

  return (
    <div
      className="sticky-tabs"
      role="tablist"
      aria-label="Profile sections"
      data-testid="profile-tabs"
    >
      <div className="max-w-5xl mx-auto px-6">
        <div className="relative flex gap-0 overflow-x-auto scrollbar-none">
          {TABS.map((tab, i) => (
            <button
              key={tab.id}
              ref={(el) => { tabRefs.current[i] = el; }}
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={activeTab === tab.id}
              aria-controls={`panel-${tab.id}`}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'px-4 py-4 text-sm font-medium whitespace-nowrap transition-colors duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan focus-visible:ring-inset',
                activeTab === tab.id
                  ? 'text-text-primary'
                  : 'text-text-muted hover:text-text-secondary'
              )}
            >
              {tab.label}
            </button>
          ))}

          {/* Sliding underline */}
          <div
            className="absolute bottom-0 h-0.5 bg-accent-cyan rounded-full transition-all duration-300"
            style={{
              left: underlineStyle.left,
              width: underlineStyle.width,
              transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            aria-hidden="true"
            data-testid="tab-underline"
          />
        </div>
      </div>
    </div>
  );
}
