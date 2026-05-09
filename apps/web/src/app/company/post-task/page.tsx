'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { DEFAULT_POST_TASK_STATE } from './_components/post-task-store';
import { Step1TaskType } from './_components/step1-task-type';
import { Step2Details } from './_components/step2-details';
import { Step3TimelineReward } from './_components/step3-timeline-reward';
import { Step4AccessTrust } from './_components/step4-access-trust';
import { Step5ReviewAI } from './_components/step5-review-ai';
import type { PostTaskState } from '@/lib/bounty-data';

const STEPS = [
  { num: 1, label: 'Task Type',        desc: 'Bounty, Direct, or Contest' },
  { num: 2, label: 'Details',          desc: 'Problem & deliverables' },
  { num: 3, label: 'Timeline & Reward',desc: 'Budget & deadline' },
  { num: 4, label: 'Access & Trust',   desc: 'NDA, score, difficulty' },
  { num: 5, label: 'Review & Publish', desc: 'AI enrichment & publish' },
];

export default function PostTaskPage() {
  const router = useRouter();
  const [step, setStep] = React.useState(1);
  const [state, setState] = React.useState<PostTaskState>(DEFAULT_POST_TASK_STATE);
  const [direction, setDirection] = React.useState<'forward' | 'back'>('forward');
  const [animating, setAnimating] = React.useState(false);

  function patch(update: Partial<PostTaskState>) {
    setState((prev) => ({ ...prev, ...update }));
  }

  function goTo(next: number, dir: 'forward' | 'back' = 'forward') {
    if (animating) return;
    setDirection(dir);
    setAnimating(true);
    setTimeout(() => { setStep(next); setAnimating(false); }, 300);
  }

  function handleNext() { if (step < 5) goTo(step + 1, 'forward'); }
  function handleBack() { if (step > 1) goTo(step - 1, 'back'); }

  function handlePublish() {
    // In production: call API, then redirect to Razorpay
    router.push('/company/dashboard');
  }

  const canNext = (): boolean => {
    if (step === 1) return !!state.type;
    if (step === 2) return !!(state.title && state.problemStatement && state.expectedOutcome);
    if (step === 3) return !!(state.rewardAmount && state.deadline);
    return true;
  };

  return (
    <div className="min-h-screen bg-bg-base flex">
      {/* Sidebar stepper */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-[rgba(255,255,255,0.06)] bg-bg-surface min-h-screen sticky top-0 h-screen overflow-y-auto">
        <div className="px-5 py-5 border-b border-[rgba(255,255,255,0.06)]">
          <p className="font-display font-bold text-text-primary text-base">Post a Task</p>
          <p className="text-xs text-text-muted mt-0.5">Step {step} of {STEPS.length}</p>
        </div>
        <nav className="flex-1 px-4 py-5 space-y-1">
          {STEPS.map((s) => {
            const done   = s.num < step;
            const active = s.num === step;
            return (
              <div
                key={s.num}
                className={cn('flex items-start gap-3 px-3 py-2.5 rounded-lg', active && 'bg-[rgba(0,212,255,0.06)]', s.num > step && 'opacity-40')}
              >
                <div className="shrink-0 mt-0.5">
                  {done ? (
                    <div className="w-6 h-6 rounded-full bg-accent-cyan flex items-center justify-center">
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true"><path d="M1 4L3.5 6.5L9 1" stroke="#080B14" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                  ) : active ? (
                    <div className="w-6 h-6 rounded-full border-2 border-accent-cyan flex items-center justify-center animate-pulse-ring">
                      <div className="w-2 h-2 rounded-full bg-accent-cyan" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-[rgba(255,255,255,0.15)] flex items-center justify-center">
                      <span className="text-[10px] font-mono text-text-muted">{s.num}</span>
                    </div>
                  )}
                </div>
                <div>
                  <p className={cn('text-sm font-medium', active ? 'text-text-primary' : done ? 'text-text-secondary' : 'text-text-muted')}>{s.label}</p>
                  <p className="text-xs text-text-muted">{s.desc}</p>
                </div>
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex items-start justify-center px-4 py-8 md:px-12 md:py-12">
        <div className="w-full max-w-[640px]">
          {/* Step content */}
          <div
            className={cn(
              'transition-all duration-300',
              animating
                ? direction === 'forward' ? 'opacity-0 -translate-x-4' : 'opacity-0 translate-x-4'
                : 'opacity-100 translate-x-0'
            )}
          >
            {step === 1 && <Step1TaskType selected={state.type} onSelect={(t) => patch({ type: t })} />}
            {step === 2 && <Step2Details state={state} onChange={patch} />}
            {step === 3 && <Step3TimelineReward state={state} onChange={patch} />}
            {step === 4 && <Step4AccessTrust state={state} onChange={patch} />}
            {step === 5 && <Step5ReviewAI state={state} onChange={patch} onPublish={handlePublish} />}
          </div>

          {/* Navigation (not shown on step 5 — it has its own CTA) */}
          {step < 5 && (
            <div className="flex items-center justify-between pt-8 mt-8 border-t border-[rgba(255,255,255,0.06)]">
              {step > 1 ? (
                <button onClick={handleBack} className="text-sm text-text-muted hover:text-text-secondary transition-colors">
                  ← Back
                </button>
              ) : <div />}
              <button
                onClick={handleNext}
                disabled={!canNext()}
                className={cn(
                  'px-6 py-2.5 rounded-lg text-sm font-semibold transition-all',
                  canNext()
                    ? 'bg-accent-cyan text-bg-base hover:brightness-110 active:scale-[0.97]'
                    : 'bg-[rgba(255,255,255,0.06)] text-text-muted cursor-not-allowed'
                )}
              >
                Continue →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
