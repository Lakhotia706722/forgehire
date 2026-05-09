'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import type { AssessmentSection } from './assessment-store';

interface AssessmentTopbarProps {
  section: AssessmentSection;
  secondsLeft: number;
  tabSwitchCount: number;
}

const SECTIONS: { id: AssessmentSection; label: string }[] = [
  { id: 'mcq',      label: 'MCQ' },
  { id: 'coding',   label: 'Coding' },
  { id: 'scenario', label: 'Scenario' },
];

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function AssessmentTopbar({ section, secondsLeft, tabSwitchCount }: AssessmentTopbarProps) {
  const isAmber = secondsLeft <= 15 * 60 && secondsLeft > 5 * 60;
  const isRed   = secondsLeft <= 5 * 60;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 h-14 bg-bg-surface border-b border-[rgba(255,255,255,0.06)] flex items-center px-6 gap-4"
      role="banner"
      aria-label="Assessment navigation"
    >
      {/* Logo + badge */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-6 h-6 rounded bg-accent-cyan flex items-center justify-center">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" stroke="#080B14" strokeWidth="1.5" strokeLinejoin="round"/>
            <circle cx="8" cy="8" r="2" fill="#080B14"/>
          </svg>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-red animate-pulse" aria-hidden="true" />
          <span className="text-xs font-mono text-text-secondary">Assessment in Progress</span>
        </div>
      </div>

      {/* Section pills — center */}
      <div className="flex-1 flex items-center justify-center gap-2" role="tablist" aria-label="Assessment sections">
        {SECTIONS.map((s) => (
          <div
            key={s.id}
            role="tab"
            aria-selected={section === s.id}
            className={cn(
              'px-4 py-1.5 rounded-full text-xs font-mono font-medium transition-all',
              section === s.id
                ? 'bg-accent-cyan text-bg-base'
                : 'text-text-muted border border-[rgba(255,255,255,0.08)]'
            )}
          >
            {s.label}
          </div>
        ))}
      </div>

      {/* Right: timer + proctoring */}
      <div className="flex items-center gap-4 shrink-0">
        {/* Proctoring badge */}
        <div className="hidden sm:flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-green" aria-hidden="true" />
          <span className="text-xs text-text-muted font-mono">Proctoring Active</span>
          {tabSwitchCount > 0 && (
            <span className="text-xs text-accent-amber font-mono ml-1">
              ({tabSwitchCount} switch{tabSwitchCount > 1 ? 'es' : ''})
            </span>
          )}
        </div>

        {/* Timer */}
        <div
          className={cn(
            'font-mono font-bold text-xl tabular-nums transition-colors',
            isRed   ? 'text-accent-red animate-pulse' :
            isAmber ? 'text-accent-amber' :
            'text-text-primary'
          )}
          aria-live="polite"
          aria-label={`Time remaining: ${formatTime(secondsLeft)}`}
          data-testid="assessment-timer"
        >
          {formatTime(secondsLeft)}
        </div>
      </div>
    </div>
  );
}
