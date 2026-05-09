'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { calcCompletion, type OnboardingState } from '@/lib/onboarding-store';

interface Step7Props {
  state: OnboardingState;
  onJumpTo: (step: number) => void;
}

export function Step7Review({ state, onJumpTo }: Step7Props) {
  const completion = calcCompletion(state);
  const canUnlockAssessment = completion >= 70;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-text-primary mb-1">Review Your Profile</h2>
        <p className="text-text-secondary text-sm">Check everything before we go live.</p>
      </div>

      {/* Completion gauge */}
      <div className={cn(
        'p-5 rounded-xl border',
        canUnlockAssessment
          ? 'bg-[rgba(16,185,129,0.06)] border-[rgba(16,185,129,0.2)]'
          : 'bg-[rgba(245,158,11,0.06)] border-[rgba(245,158,11,0.2)]'
      )}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-text-primary">Profile Completion</span>
          <span className={cn(
            'font-mono font-bold text-2xl',
            canUnlockAssessment ? 'text-accent-green' : 'text-accent-amber'
          )}>
            {completion}%
          </span>
        </div>
        <div className="h-2 bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-700',
              canUnlockAssessment ? 'bg-accent-green' : 'bg-accent-amber'
            )}
            style={{ width: `${completion}%` }}
          />
        </div>
        {!canUnlockAssessment && (
          <p className="text-xs text-accent-amber mt-2">
            Reach 70% to unlock the NeuronScore Assessment
          </p>
        )}
      </div>

      {/* Sections */}
      <div className="space-y-3">
        <ReviewSection
          step={1}
          title="Basic Info"
          complete={!!(state.fullName && state.headline && state.location && state.workMode)}
          onEdit={() => onJumpTo(1)}
        >
          {state.fullName && <p className="text-sm text-text-primary">{state.fullName}</p>}
          {state.headline && <p className="text-xs text-text-secondary">{state.headline}</p>}
          {state.location && <p className="text-xs text-text-muted">{state.location}</p>}
        </ReviewSection>

        <ReviewSection
          step={2}
          title="Skills"
          complete={state.skills.length >= 3}
          warning={state.skills.length > 0 && state.skills.length < 3 ? 'Add at least 3 skills' : undefined}
          onEdit={() => onJumpTo(2)}
        >
          <div className="flex flex-wrap gap-1.5">
            {state.skills.map((s) => (
              <span key={s.id} className="text-xs px-2 py-0.5 rounded-full bg-[rgba(0,212,255,0.08)] text-accent-cyan border border-[rgba(0,212,255,0.2)] font-mono">
                {s.name}
              </span>
            ))}
            {state.skills.length === 0 && <span className="text-xs text-text-muted">No skills added</span>}
          </div>
        </ReviewSection>

        <ReviewSection
          step={3}
          title="Experience"
          complete={state.experiences.length > 0}
          onEdit={() => onJumpTo(3)}
        >
          {state.experiences.length > 0 ? (
            state.experiences.map((e) => (
              <p key={e.id} className="text-xs text-text-secondary">
                {e.role} at {e.company} ({e.startYear}–{e.current ? 'Present' : e.endYear})
              </p>
            ))
          ) : (
            <p className="text-xs text-text-muted">No experience added</p>
          )}
        </ReviewSection>

        <ReviewSection
          step={4}
          title="Projects"
          complete={state.projects.length > 0}
          warning={state.projects.length === 0 ? 'At least 1 project required' : undefined}
          onEdit={() => onJumpTo(4)}
        >
          {state.projects.length > 0 ? (
            state.projects.map((p) => (
              <p key={p.id} className="text-xs text-text-secondary">
                {p.title} <span className="text-text-muted">({p.type})</span>
              </p>
            ))
          ) : (
            <p className="text-xs text-accent-red">No projects added — required!</p>
          )}
        </ReviewSection>

        <ReviewSection
          step={5}
          title="Pricing"
          complete={!!state.hourlyRate}
          onEdit={() => onJumpTo(5)}
        >
          {state.hourlyRate ? (
            <p className="text-sm font-mono text-accent-cyan">₹{state.hourlyRate}/hr</p>
          ) : (
            <p className="text-xs text-text-muted">No rate set</p>
          )}
        </ReviewSection>

        <ReviewSection
          step={6}
          title="Payment"
          complete={!!state.upiId}
          onEdit={() => onJumpTo(6)}
        >
          {state.upiId ? (
            <p className="text-xs font-mono text-text-secondary">{state.upiId}</p>
          ) : (
            <p className="text-xs text-text-muted">No UPI ID added</p>
          )}
        </ReviewSection>
      </div>
    </div>
  );
}

function ReviewSection({
  title, complete, warning, onEdit, children, step,
}: {
  title: string;
  complete: boolean;
  warning?: string;
  onEdit: () => void;
  children: React.ReactNode;
  step: number;
}) {
  return (
    <div className={cn(
      'p-4 rounded-xl border',
      complete
        ? 'border-[rgba(255,255,255,0.06)] bg-bg-surface'
        : warning
        ? 'border-[rgba(239,68,68,0.2)] bg-[rgba(239,68,68,0.04)]'
        : 'border-[rgba(255,255,255,0.06)] bg-bg-surface'
    )}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {complete ? (
            <div className="w-5 h-5 rounded-full bg-accent-cyan flex items-center justify-center">
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
                <path d="M1 4L3.5 6.5L9 1" stroke="#080B14" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          ) : (
            <div className="w-5 h-5 rounded-full border-2 border-[rgba(255,255,255,0.2)] flex items-center justify-center">
              <span className="text-[9px] font-mono text-text-muted">{step}</span>
            </div>
          )}
          <span className="text-sm font-medium text-text-primary">{title}</span>
          {warning && <span className="text-xs text-accent-red">{warning}</span>}
        </div>
        <button
          onClick={onEdit}
          className="text-xs text-accent-cyan hover:underline"
          aria-label={`Edit ${title}`}
        >
          Edit
        </button>
      </div>
      <div className="pl-7 space-y-0.5">{children}</div>
    </div>
  );
}
