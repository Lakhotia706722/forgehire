'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatReward } from '@/lib/bounty-data';
import type { PostTaskState, AIEnrichmentResult } from '@/lib/bounty-data';

interface Step5Props {
  state: PostTaskState;
  onChange: (patch: Partial<PostTaskState>) => void;
  onAnalyzeAI?: () => Promise<AIEnrichmentResult>;
  onPublish: () => void;
  publishing?: boolean;
}

export function Step5ReviewAI({ state, onChange, onAnalyzeAI, onPublish, publishing = false }: Step5Props) {
  const [analyzing, setAnalyzing] = React.useState(false);

  async function handleAnalyze() {
    setAnalyzing(true);
    try {
      const result = onAnalyzeAI
        ? await onAnalyzeAI()
        : await new Promise<AIEnrichmentResult>((resolve) =>
            setTimeout(
              () =>
                resolve({
            estimatedDays: [14, 21],
            suggestedReward: [
              Math.round(parseFloat(state.rewardAmount || '0') * 0.9),
              Math.round(parseFloat(state.rewardAmount || '0') * 1.2),
            ],
            postingQuality: 7.8,
            deliverableGaps:
              state.deliverables.length < 3
                ? ['Add more specific deliverables with acceptance criteria']
                : [],
            recommendedType: state.type ?? 'Bounty',
            suggestions: [
              'Add performance benchmarks to expected outcome',
              'Specify the tech stack more precisely',
              'Consider adding a staging environment to access provided',
            ],
                }),
              2000,
            ),
          );
      onChange({ aiResult: result });
    } finally {
      setAnalyzing(false);
    }
  }

  const r = state.aiResult;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-text-primary mb-1">Review & AI Enrichment</h2>
        <p className="text-text-secondary text-sm">Review your task and get AI-powered insights before publishing.</p>
      </div>

      {/* Summary */}
      <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          {state.type && <Badge variant={state.type === 'Bounty' ? 'cyan' : state.type === 'Direct' ? 'violet' : 'amber'}>{state.type}</Badge>}
          {state.difficulty && <Badge variant="gray">{state.difficulty}</Badge>}
        </div>
        <h3 className="font-display font-semibold text-text-primary text-lg">{state.title || 'Untitled Task'}</h3>
        {state.categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {state.categories.map((c) => <Badge key={c} variant="gray" className="text-[10px]">{c}</Badge>)}
          </div>
        )}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-text-muted mb-0.5">Reward</p>
            <p className="font-mono font-bold text-accent-amber">{state.rewardAmount ? formatReward(parseFloat(state.rewardAmount)) : '—'}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted mb-0.5">Deadline</p>
            <p className="font-mono text-text-primary">{state.deadline || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted mb-0.5">Min NeuronScore</p>
            <p className="font-mono text-text-primary">{state.minNeuronScore}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted mb-0.5">NDA Required</p>
            <p className="font-mono text-text-primary">{state.ndaRequired ? 'Yes' : 'No'}</p>
          </div>
        </div>
        {state.deliverables.length > 0 && (
          <div>
            <p className="text-xs text-text-muted mb-1.5">Deliverables ({state.deliverables.length})</p>
            <ul className="space-y-1">
              {state.deliverables.map((d) => (
                <li key={d.id} className="text-xs text-text-secondary flex items-center gap-1.5">
                  <span className="text-accent-cyan" aria-hidden="true">·</span>
                  {d.title || 'Untitled deliverable'}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* AI Analyze button */}
      {!r && (
        <Button
          variant="secondary"
          size="md"
          className="w-full border-[rgba(123,94,167,0.4)] text-accent-violet hover:bg-[rgba(123,94,167,0.06)]"
          loading={analyzing}
          disabled={analyzing}
          onClick={handleAnalyze}
          data-testid="analyze-ai-btn"
        >
          {analyzing ? 'Analyzing...' : '✨ Analyze with AI'}
        </Button>
      )}

      {/* AI result */}
      {r && (
        <div
          className="bg-[rgba(123,94,167,0.06)] border border-[rgba(123,94,167,0.2)] rounded-xl p-5 space-y-4"
          data-testid="ai-result-panel"
        >
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="#7B5EA7" aria-hidden="true">
              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd"/>
            </svg>
            <span className="text-sm font-medium text-accent-violet">AI Task Intelligence</span>
            <span className="ml-auto text-xs font-mono text-accent-violet">Quality: {r.postingQuality}/10</span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-text-muted mb-0.5">Estimated Timeline</p>
              <p className="font-mono text-text-primary">{r.estimatedDays[0]}–{r.estimatedDays[1]} days</p>
            </div>
            <div>
              <p className="text-xs text-text-muted mb-0.5">Suggested Reward</p>
              <p className="font-mono text-text-primary">
                {formatReward(r.suggestedReward[0])}–{formatReward(r.suggestedReward[1])}
              </p>
            </div>
          </div>

          {r.deliverableGaps.length > 0 && (
            <div>
              <p className="text-xs text-accent-amber mb-1.5">⚠ Deliverable Gaps</p>
              {r.deliverableGaps.map((g, i) => (
                <p key={i} className="text-xs text-text-secondary">{g}</p>
              ))}
            </div>
          )}

          {r.suggestions.length > 0 && (
            <div>
              <p className="text-xs text-text-muted mb-1.5">Suggestions</p>
              <ul className="space-y-1">
                {r.suggestions.map((s, i) => (
                  <li key={i} className="text-xs text-text-secondary flex items-start gap-1.5">
                    <span className="text-accent-violet mt-0.5" aria-hidden="true">→</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={() => onChange({ aiResult: null })}
            className="text-xs text-text-muted hover:text-text-secondary transition-colors"
          >
            Re-analyze
          </button>
        </div>
      )}

      {/* Publish CTA */}
      <div className="pt-4 border-t border-[rgba(255,255,255,0.06)]">
        <Button
          size="lg"
          className="w-full"
          onClick={onPublish}
          disabled={!state.title || !state.type || !state.rewardAmount || !state.deadline || publishing}
          loading={publishing}
          data-testid="publish-btn"
        >
          {publishing ? 'Publishing…' : 'Deposit Escrow & Publish'}
        </Button>
        <p className="text-xs text-text-muted text-center mt-2">
          Your task will be submitted for AI enrichment and listed once escrow is funded.
        </p>
      </div>
    </div>
  );
}
