'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import type { TaskType } from '@/lib/bounty-data';

const TASK_TYPES: {
  type: TaskType;
  icon: string;
  description: string;
  bestFor: string[];
  color: string;
  borderColor: string;
  bgColor: string;
}[] = [
  {
    type: 'Bounty',
    icon: '🎯',
    description: 'Post a task with a fixed reward. Any verified engineer can participate and submit a solution.',
    bestFor: ['One-time deliverables', 'Specific technical problems', 'When you want multiple solutions to compare'],
    color: '#00D4FF',
    borderColor: 'rgba(0,212,255,0.5)',
    bgColor: 'rgba(0,212,255,0.06)',
  },
  {
    type: 'Direct',
    icon: '🤝',
    description: 'Hire a specific engineer directly for a project. Best for ongoing work or when you have a preferred candidate.',
    bestFor: ['Ongoing projects', 'Hourly or milestone-based work', 'When you already have someone in mind'],
    color: '#7B5EA7',
    borderColor: 'rgba(123,94,167,0.5)',
    bgColor: 'rgba(123,94,167,0.06)',
  },
  {
    type: 'Contest',
    icon: '🏆',
    description: 'Run a competition with ranked prizes. Multiple engineers compete and top solutions win.',
    bestFor: ['Innovation challenges', 'When you want the best possible solution', 'Community engagement'],
    color: '#F59E0B',
    borderColor: 'rgba(245,158,11,0.5)',
    bgColor: 'rgba(245,158,11,0.06)',
  },
];

interface Step1Props {
  selected: TaskType | null;
  onSelect: (type: TaskType) => void;
}

export function Step1TaskType({ selected, onSelect }: Step1Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-text-primary mb-1">What type of task is this?</h2>
        <p className="text-text-secondary text-sm">Choose the engagement model that best fits your needs.</p>
      </div>

      <div className="grid gap-4" role="radiogroup" aria-label="Task type selection">
        {TASK_TYPES.map((t) => (
          <button
            key={t.type}
            type="button"
            role="radio"
            aria-checked={selected === t.type}
            onClick={() => onSelect(t.type)}
            className={cn(
              'text-left p-5 rounded-2xl border-2 transition-all duration-200',
              'hover:-translate-y-0.5',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base',
              selected === t.type
                ? 'border-[var(--border)] bg-[var(--bg)]'
                : 'border-[rgba(255,255,255,0.06)] bg-bg-surface hover:border-[var(--border)]'
            )}
            style={{
              '--border': t.borderColor,
              '--bg': t.bgColor,
            } as React.CSSProperties}
          >
            <div className="flex items-start gap-4">
              <span className="text-3xl shrink-0" aria-hidden="true">{t.icon}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-display font-bold text-text-primary text-lg">{t.type}</span>
                  {selected === t.type && (
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ background: t.color }}
                      aria-hidden="true"
                    >
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L3.5 6.5L9 1" stroke="#080B14" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )}
                </div>
                <p className="text-text-secondary text-sm mb-3">{t.description}</p>
                <div>
                  <p className="text-xs text-text-muted mb-1.5">Best for:</p>
                  <ul className="space-y-1">
                    {t.bestFor.map((b) => (
                      <li key={b} className="flex items-center gap-1.5 text-xs text-text-muted">
                        <span style={{ color: t.color }} aria-hidden="true">·</span>
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
