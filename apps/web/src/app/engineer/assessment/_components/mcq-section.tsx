'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import type { MCQQuestion } from './assessment-store';

interface MCQSectionProps {
  questions: MCQQuestion[];
  currentIndex: number;
  onAnswer: (questionId: string, optionIndex: number) => void;
  onFlag: (questionId: string) => void;
  onNavigate: (index: number) => void;
}

export function MCQSection({
  questions, currentIndex, onAnswer, onFlag, onNavigate,
}: MCQSectionProps) {
  const [animating, setAnimating] = React.useState(false);
  const [direction, setDirection] = React.useState<'next' | 'prev'>('next');
  const q = questions[currentIndex];

  function navigate(idx: number) {
    if (animating || idx === currentIndex) return;
    setDirection(idx > currentIndex ? 'next' : 'prev');
    setAnimating(true);
    setTimeout(() => {
      onNavigate(idx);
      setAnimating(false);
    }, 200);
  }

  function getStatusColor(q: MCQQuestion): string {
    if (q.flagged) return 'bg-accent-amber';
    if (q.selectedOption !== null) return 'bg-accent-cyan';
    return 'bg-[rgba(255,255,255,0.08)]';
  }

  return (
    <div className="flex h-full">
      {/* Main question area */}
      <div className="flex-1 flex flex-col p-6 overflow-y-auto">
        {/* Question header */}
        <div className="flex items-center justify-between mb-6">
          <span className="text-xs font-mono text-text-muted">
            Question {q.number} of {questions.length}
          </span>
          <button
            onClick={() => onFlag(q.id)}
            className={cn(
              'flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all',
              q.flagged
                ? 'border-[rgba(245,158,11,0.4)] bg-[rgba(245,158,11,0.08)] text-accent-amber'
                : 'border-[rgba(255,255,255,0.08)] text-text-muted hover:border-[rgba(245,158,11,0.3)] hover:text-accent-amber'
            )}
            aria-pressed={q.flagged}
            aria-label={q.flagged ? 'Unflag question' : 'Flag for review'}
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill={q.flagged ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M2 2v14M2 2h9l-2 4 2 4H2"/>
            </svg>
            {q.flagged ? 'Flagged' : 'Flag for review'}
          </button>
        </div>

        {/* Question text */}
        <div
          className={cn(
            'transition-all duration-200',
            animating
              ? direction === 'next' ? 'opacity-0 -translate-x-4' : 'opacity-0 translate-x-4'
              : 'opacity-100 translate-x-0'
          )}
        >
          <p className="text-text-primary text-base leading-relaxed mb-6 font-medium">
            {q.text}
          </p>

          {/* Options */}
          <div className="space-y-3" role="radiogroup" aria-label="Answer options">
            {q.options.map((option, i) => (
              <button
                key={i}
                role="radio"
                aria-checked={q.selectedOption === i}
                onClick={() => onAnswer(q.id, i)}
                className={cn(
                  'w-full text-left px-4 py-3.5 rounded-xl border transition-all duration-150',
                  'flex items-start gap-3',
                  q.selectedOption === i
                    ? 'border-[rgba(0,212,255,0.5)] bg-[rgba(0,212,255,0.06)] border-l-4 border-l-accent-cyan'
                    : 'border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.15)] hover:bg-[rgba(255,255,255,0.02)]'
                )}
              >
                <span
                  className={cn(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all',
                    q.selectedOption === i
                      ? 'border-accent-cyan bg-accent-cyan'
                      : 'border-[rgba(255,255,255,0.2)]'
                  )}
                  aria-hidden="true"
                >
                  {q.selectedOption === i && (
                    <div className="w-2 h-2 rounded-full bg-bg-base" />
                  )}
                </span>
                <span className={cn(
                  'text-sm leading-relaxed',
                  q.selectedOption === i ? 'text-text-primary' : 'text-text-secondary'
                )}>
                  {option}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-[rgba(255,255,255,0.06)]">
          <button
            onClick={() => navigate(currentIndex - 1)}
            disabled={currentIndex === 0}
            className="text-sm text-text-muted hover:text-text-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            ← Previous
          </button>
          <span className="text-xs font-mono text-text-muted">
            {questions.filter((q) => q.selectedOption !== null).length}/{questions.length} answered
          </span>
          <button
            onClick={() => navigate(currentIndex + 1)}
            disabled={currentIndex === questions.length - 1}
            className="text-sm text-text-muted hover:text-text-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Next →
          </button>
        </div>
      </div>

      {/* Right sidebar: question grid */}
      <div
        className="hidden lg:flex flex-col w-56 shrink-0 border-l border-[rgba(255,255,255,0.06)] p-4"
        aria-label="Question navigation"
      >
        <p className="text-xs font-mono text-text-muted mb-3 uppercase tracking-wider">Questions</p>
        <div className="grid grid-cols-5 gap-1.5">
          {questions.map((q, i) => (
            <button
              key={q.id}
              onClick={() => navigate(i)}
              aria-label={`Question ${q.number}${q.selectedOption !== null ? ', answered' : ''}${q.flagged ? ', flagged' : ''}${i === currentIndex ? ', current' : ''}`}
              className={cn(
                'w-8 h-8 rounded-lg text-xs font-mono font-medium transition-all duration-150',
                i === currentIndex
                  ? 'ring-2 ring-white ring-offset-1 ring-offset-bg-base'
                  : '',
                q.flagged
                  ? 'bg-accent-amber text-bg-base'
                  : q.selectedOption !== null
                  ? 'bg-accent-cyan text-bg-base'
                  : 'bg-[rgba(255,255,255,0.06)] text-text-muted hover:bg-[rgba(255,255,255,0.1)]'
              )}
            >
              {q.number}
            </button>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-4 space-y-1.5">
          {[
            { color: 'bg-accent-cyan',   label: 'Answered' },
            { color: 'bg-accent-amber',  label: 'Flagged' },
            { color: 'bg-[rgba(255,255,255,0.06)]', label: 'Unanswered' },
          ].map((l) => (
            <div key={l.label} className="flex items-center gap-2">
              <div className={cn('w-3 h-3 rounded', l.color)} aria-hidden="true" />
              <span className="text-xs text-text-muted">{l.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
