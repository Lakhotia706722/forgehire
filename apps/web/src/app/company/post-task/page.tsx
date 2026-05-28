'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { apiFetch } from '@/lib/api-fetch';
import { DEFAULT_POST_TASK_STATE } from './_components/post-task-store';
import { Step1TaskType } from './_components/step1-task-type';
import { Step2Details } from './_components/step2-details';
import { Step3TimelineReward } from './_components/step3-timeline-reward';
import { Step4AccessTrust } from './_components/step4-access-trust';
import { Step5ReviewAI } from './_components/step5-review-ai';
import type { PostTaskState, AIEnrichmentResult } from '@/lib/bounty-data';

const STEPS = [
  { num: 1, label: 'Task Type',        desc: 'Bounty, Direct, or Contest' },
  { num: 2, label: 'Details',          desc: 'Problem & deliverables' },
  { num: 3, label: 'Timeline & Reward',desc: 'Budget & deadline' },
  { num: 4, label: 'Access & Trust',   desc: 'NDA, score, difficulty' },
  { num: 5, label: 'Review & Publish', desc: 'AI enrichment & publish' },
];

/** Map UI PostTaskState → createTaskSchema payload */
function buildTaskPayload(state: PostTaskState) {
  const rewardAmount = parseFloat(state.rewardAmount || '0');
  // Compute timeline in days from deadline string
  const deadlineDays = state.deadline
    ? Math.max(1, Math.ceil((new Date(state.deadline).getTime() - Date.now()) / 86_400_000))
    : 30;

  const type = (state.type?.toLowerCase() ?? 'bounty') as 'bounty' | 'direct' | 'contest';
  const difficulty = (state.difficulty?.toLowerCase() || 'medium') as 'easy' | 'medium' | 'hard' | 'expert';

  const payload: Record<string, unknown> = {
    title: state.title,
    type,
    category: state.categories.length > 0 ? state.categories : ['General'],
    problemStatement: state.problemStatement,
    currentState: state.currentState || null,
    expectedOutcome: state.expectedOutcome,
    deliverables: state.deliverables.map((d) => ({
      title: d.title,
      description: d.description,
    })),
    techRequirements: state.techRequirements.length > 0 ? state.techRequirements : ['Not specified'],
    timeline: deadlineDays,
    rewardAmount,
    paymentType: state.paymentType || 'fixed',
    currency: 'INR',
    selectionCriteria: [{ name: 'Overall quality', weight: 100 }],
    minNeuronScore: state.minNeuronScore ?? 0,
    ndaRequired: state.ndaRequired ?? false,
    difficulty,
    isContest: type === 'contest',
  };

  if (type === 'contest' && state.contestPrizes?.length > 0) {
    payload.contestRanks = state.contestPrizes.map((p) => ({
      rank: p.rank,
      percentage: p.percentage,
    }));
    payload.maxWinners = state.contestPrizes.length;
  }

  return payload;
}

export default function PostTaskPage() {
  const router = useRouter();
  const [step, setStep] = React.useState(1);
  const [state, setState] = React.useState<PostTaskState>(DEFAULT_POST_TASK_STATE);
  const [direction, setDirection] = React.useState<'forward' | 'back'>('forward');
  const [animating, setAnimating] = React.useState(false);
  const [publishing, setPublishing] = React.useState(false);

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

  async function handlePublish() {
    if (publishing) return;
    setPublishing(true);
    try {
      const created = await apiFetch<{ id: string }>('/api/tasks', {
        method: 'POST',
        body: JSON.stringify(buildTaskPayload(state)),
      });
      await apiFetch(`/api/tasks/${created.id}/escrow/create`, {
        method: 'POST',
      });
      toast.success('Task created and escrow order generated. Complete payment to make it live.');
      router.push('/company/tasks');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to publish task. Please try again.');
    } finally {
      setPublishing(false);
    }
  }

  async function handleAnalyzeAI(): Promise<AIEnrichmentResult> {
    const payload = buildTaskPayload(state);
    const preview = await apiFetch<{
      estimatedTimeline: string;
      suggestedRewardRange: { min: number; max: number };
      qualityScore: number;
      qualityIssues: string[];
      recommendedTaskType: 'bounty' | 'direct' | 'contest';
      suggestedSkillTags: string[];
      suggestions?: string[];
    }>('/api/tasks/ai-preview', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const timelineMatch = preview.estimatedTimeline.match(/(\d+)\D+(\d+)/);
    const estimatedDays: [number, number] = timelineMatch
      ? [Number(timelineMatch[1]), Number(timelineMatch[2])]
      : [7, 14];
    const typeLabel =
      preview.recommendedTaskType === 'bounty'
        ? 'Bounty'
        : preview.recommendedTaskType === 'direct'
          ? 'Direct'
          : 'Contest';
    return {
      estimatedDays,
      suggestedReward: [preview.suggestedRewardRange.min, preview.suggestedRewardRange.max],
      postingQuality: preview.qualityScore,
      deliverableGaps: preview.qualityIssues,
      recommendedType: typeLabel,
      suggestions: preview.suggestions ?? preview.suggestedSkillTags.map((skill) => `Consider adding ${skill} to requirements`),
    };
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
            {step === 5 && (
              <Step5ReviewAI
                state={state}
                onChange={patch}
                onAnalyzeAI={handleAnalyzeAI}
                onPublish={handlePublish}
                publishing={publishing}
              />
            )}
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
