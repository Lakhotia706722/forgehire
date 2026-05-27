'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { AriaNavButton } from '@/components/ui/aria-tab-button';
import { leftPctClass, quantizePct, wPctClass } from '@/lib/pct-classes';

export type TabId = 'projects' | 'experience' | 'tech-stack' | 'reviews' | 'marketplace' | 'activity';

const TABS: { id: TabId; label: string }[] = [
  { id: 'projects', label: 'Projects' },
  { id: 'experience', label: 'Experience' },
  { id: 'tech-stack', label: 'Tech Stack' },
  { id: 'reviews', label: 'Reviews' },
  { id: 'marketplace', label: 'Marketplace' },
  { id: 'activity', label: 'Activity' },
];

interface ProfileTabsProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function ProfileTabs({ activeTab, onTabChange }: ProfileTabsProps) {
  const tabRefs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const [underlinePct, setUnderlinePct] = React.useState({ left: 0, width: 20 });

  React.useEffect(() => {
    const idx = TABS.findIndex((t) => t.id === activeTab);
    const el = tabRefs.current[idx];
    if (!el) return;
    const parent = el.parentElement;
    if (!parent) return;
    const parentRect = parent.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    if (parentRect.width <= 0) return;
    setUnderlinePct({
      left: quantizePct(((elRect.left - parentRect.left) / parentRect.width) * 100),
      width: quantizePct((elRect.width / parentRect.width) * 100),
    });
  }, [activeTab]);

  return (
    <nav
      className="sticky-tabs"
      aria-label="Profile sections"
      data-testid="profile-tabs"
    >
      <div className="max-w-5xl mx-auto px-6">
        <div className="relative flex gap-0 overflow-x-auto scrollbar-none" role="group" aria-label="Profile section tabs">
          {TABS.map((tab, i) => (
            <AriaNavButton
              key={tab.id}
              ref={(el) => { tabRefs.current[i] = el; }}
              id={`tab-${tab.id}`}
              current={activeTab === tab.id}
              aria-controls={`panel-${tab.id}`}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'px-4 py-4 text-sm font-medium whitespace-nowrap transition-colors duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan focus-visible:ring-inset',
                activeTab === tab.id
                  ? 'text-text-primary'
                  : 'text-text-muted hover:text-text-secondary',
              )}
            >
              {tab.label}
            </AriaNavButton>
          ))}

          <div
            className={cn(
              'absolute bottom-0 h-0.5 bg-accent-cyan rounded-full transition-all duration-300 tab-underline-slide',
              leftPctClass(underlinePct.left),
              wPctClass(underlinePct.width),
            )}
            aria-hidden="true"
            data-testid="tab-underline"
          />
        </div>
      </div>
    </nav>
  );
}
