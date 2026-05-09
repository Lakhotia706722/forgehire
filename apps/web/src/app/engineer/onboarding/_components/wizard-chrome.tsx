'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { calcCompletion, type OnboardingState } from '@/lib/onboarding-store';

const STEPS = [
  { num: 1, label: 'Basic Info',    desc: 'Photo, name, location' },
  { num: 2, label: 'Skills',        desc: 'Your AI expertise' },
  { num: 3, label: 'Experience',    desc: 'Work history' },
  { num: 4, label: 'Projects',      desc: 'What you\'ve built' },
  { num: 5, label: 'Pricing',       desc: 'Rates & availability' },
  { num: 6, label: 'Payment',       desc: 'UPI & bank details' },
  { num: 7, label: 'Review',        desc: 'Check everything' },
  { num: 8, label: 'Done!',         desc: 'Take your assessment' },
];

interface WizardChromeProps {
  currentStep: number;
  state: OnboardingState;
  children: React.ReactNode;
}

export function WizardChrome({ currentStep, state, children }: WizardChromeProps) {
  const completion = calcCompletion(state);

  return (
    <div className="min-h-screen bg-bg-base flex flex-col md:flex-row">
      {/* ── Mobile: horizontal progress bar ─────────────── */}
      <div className="md:hidden sticky top-0 z-40 bg-bg-surface border-b border-[rgba(255,255,255,0.06)] px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono text-text-muted">
            Step {currentStep} of {STEPS.length}
          </span>
          <span className="text-xs font-mono text-accent-cyan">{completion}% complete</span>
        </div>
        <div className="h-1.5 bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden">
          <div
            className="h-full bg-accent-cyan rounded-full transition-all duration-500"
            style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* ── Desktop: left sidebar ────────────────────────── */}
      <aside
        className="hidden md:flex flex-col w-72 shrink-0 border-r border-[rgba(255,255,255,0.06)] bg-bg-surface min-h-screen sticky top-0 h-screen overflow-y-auto"
        aria-label="Onboarding steps"
      >
        {/* Logo */}
        <div className="px-6 py-5 border-b border-[rgba(255,255,255,0.06)]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-accent-cyan flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" stroke="#080B14" strokeWidth="1.5" strokeLinejoin="round"/>
                <circle cx="8" cy="8" r="2" fill="#080B14"/>
              </svg>
            </div>
            <span className="font-display font-bold text-text-primary text-base">NeuronHire</span>
          </div>
          <p className="text-xs text-text-muted mt-1">Profile Builder</p>
        </div>

        {/* Stepper */}
        <nav className="flex-1 px-4 py-6 space-y-1" aria-label="Wizard steps">
          {STEPS.map((step) => {
            const done    = step.num < currentStep;
            const active  = step.num === currentStep;
            const future  = step.num > currentStep;

            return (
              <div
                key={step.num}
                className={cn(
                  'flex items-start gap-3 px-3 py-2.5 rounded-lg transition-colors',
                  active  && 'bg-[rgba(0,212,255,0.06)]',
                  future  && 'opacity-40',
                )}
                aria-current={active ? 'step' : undefined}
              >
                {/* Step indicator */}
                <div className="shrink-0 mt-0.5">
                  {done ? (
                    <div className="w-6 h-6 rounded-full bg-accent-cyan flex items-center justify-center">
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
                        <path d="M1 4L3.5 6.5L9 1" stroke="#080B14" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  ) : active ? (
                    <div className="w-6 h-6 rounded-full border-2 border-accent-cyan flex items-center justify-center animate-pulse-ring">
                      <div className="w-2 h-2 rounded-full bg-accent-cyan" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-[rgba(255,255,255,0.15)] flex items-center justify-center">
                      <span className="text-[10px] font-mono text-text-muted">{step.num}</span>
                    </div>
                  )}
                </div>

                {/* Labels */}
                <div>
                  <p className={cn(
                    'text-sm font-medium',
                    active ? 'text-text-primary' : done ? 'text-text-secondary' : 'text-text-muted'
                  )}>
                    {step.label}
                  </p>
                  <p className="text-xs text-text-muted">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </nav>

        {/* Completion bar */}
        <div className="px-4 py-5 border-t border-[rgba(255,255,255,0.06)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-text-muted">Profile completion</span>
            <span className="text-xs font-mono text-accent-cyan">{completion}%</span>
          </div>
          <div className="h-1.5 bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden">
            <div
              className="h-full bg-accent-cyan rounded-full transition-all duration-700"
              style={{ width: `${completion}%` }}
              role="progressbar"
              aria-valuenow={completion}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Profile completion"
            />
          </div>
          {completion < 70 && (
            <p className="text-[10px] text-text-muted mt-1.5">
              Reach 70% to unlock the Assessment
            </p>
          )}
        </div>
      </aside>

      {/* ── Main content area ────────────────────────────── */}
      <div className="flex-1 flex items-start justify-center px-4 py-8 md:px-12 md:py-12">
        <div className="w-full max-w-[600px]">
          {children}
        </div>
      </div>
    </div>
  );
}
