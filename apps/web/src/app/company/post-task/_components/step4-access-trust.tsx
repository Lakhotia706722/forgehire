'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { AriaSwitch, AriaRadio, AriaCheckbox } from '@/components/ui/aria-tab-button';
import { wPctClass } from '@/lib/pct-classes';
import { tierToneForScore, tierToneForTierName } from '@/lib/tier-tone';
import { getTierForScore, NEURON_SCORE_TIERS } from '@/lib/bounty-data';
import type { PostTaskState, Difficulty } from '@/lib/bounty-data';

const DIFFICULTIES: Difficulty[] = ['Beginner', 'Intermediate', 'Advanced', 'Hard', 'Expert'];
const ACCESS_TYPES = [
  'Source code access',
  'Staging environment',
  'API credentials',
  'Database access (read-only)',
  'AWS/GCP credits',
  'Design files',
  'Documentation',
];

interface Step4Props {
  state: PostTaskState;
  onChange: (patch: Partial<PostTaskState>) => void;
}

export function Step4AccessTrust({ state, onChange }: Step4Props) {
  const tierInfo = getTierForScore(state.minNeuronScore);
  const tone = tierToneForScore(state.minNeuronScore);
  const scorePct = (state.minNeuronScore / 1000) * 100;

  function toggleAccess(type: string) {
    const types = state.accessTypes.includes(type)
      ? state.accessTypes.filter((t) => t !== type)
      : [...state.accessTypes, type];
    onChange({ accessTypes: types });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-text-primary mb-1">Access & Trust Settings</h2>
        <p className="text-text-secondary text-sm">Control who can participate and what they get access to.</p>
      </div>

      <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-text-primary mb-1">Require NDA</p>
            <p className="text-xs text-text-muted">Engineers must sign a Non-Disclosure Agreement before seeing full task details.</p>
          </div>
          <AriaSwitch
            checked={state.ndaRequired}
            onClick={() => onChange({ ndaRequired: !state.ndaRequired })}
            onKeyDown={(e) => e.key === 'Enter' && onChange({ ndaRequired: !state.ndaRequired })}
            aria-label="Require NDA"
            className={cn(
              'relative w-10 h-5 rounded-full transition-colors duration-200 shrink-0 cursor-pointer',
              state.ndaRequired ? 'bg-accent-cyan' : 'bg-[rgba(255,255,255,0.1)]'
            )}
          >
            <div className={cn('absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 pointer-events-none', state.ndaRequired ? 'translate-x-5' : 'translate-x-0.5')} />
          </AriaSwitch>
        </div>

        {state.ndaRequired && (
          <div className="mt-4 p-3 bg-[rgba(123,94,167,0.06)] border border-[rgba(123,94,167,0.2)] rounded-xl">
            <p className="text-xs text-text-secondary">
              ✓ A standard NDA template will be auto-generated. Engineers must sign before accessing full details.
            </p>
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-text-secondary">Minimum NeuronScore</label>
          <div className="flex items-center gap-2">
            <span className={cn('font-mono font-bold text-lg', `tier-score-${tone}`)}>
              {state.minNeuronScore}
            </span>
            <span className={cn('text-xs px-2 py-0.5 rounded-full font-mono', `tier-badge-${tone}`)}>
              {tierInfo.tier}+
            </span>
          </div>
        </div>

        <div className="relative h-6 flex items-center">
          <div className="absolute inset-x-0 h-1.5 rounded-full bg-[rgba(255,255,255,0.08)]" aria-hidden="true" />
          <div
            className={cn('absolute left-0 h-1.5 rounded-full', `tier-range-fill-${tone}`, wPctClass(scorePct))}
            aria-hidden="true"
          />
          <input
            type="range"
            min={0}
            max={1000}
            step={50}
            value={state.minNeuronScore}
            onChange={(e) => onChange({ minNeuronScore: parseInt(e.target.value) })}
            className="nh-range-input relative z-10 w-full"
            aria-label="Minimum NeuronScore"
            data-testid="neuron-score-slider"
          />
        </div>

        <div className="flex justify-between mt-2">
          {NEURON_SCORE_TIERS.map((t) => {
            const markerTone = tierToneForTierName(t.tier);
            return (
              <div key={t.tier} className="text-center">
                <div className={cn('w-px h-2 mx-auto mb-0.5', `tier-marker-${markerTone}`)} aria-hidden="true" />
                <p className={cn('text-[9px] font-mono', `tier-score-${markerTone}`)}>{t.min}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">Difficulty</label>
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Task difficulty">
          {DIFFICULTIES.map((d) => (
            <AriaRadio
              key={d}
              checked={state.difficulty === d}
              onClick={() => onChange({ difficulty: d })}
              className={cn(
                'py-2.5 rounded-xl text-sm font-medium transition-all',
                state.difficulty === d
                  ? 'bg-accent-cyan text-bg-base'
                  : 'border border-[rgba(255,255,255,0.08)] text-text-muted hover:text-text-secondary'
              )}
            >
              {d}
            </AriaRadio>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">Access Provided to Engineers</label>
        <div className="space-y-2">
          {ACCESS_TYPES.map((type) => (
            <label key={type} className="flex items-center gap-3 cursor-pointer group">
              <AriaCheckbox
                checked={state.accessTypes.includes(type)}
                onClick={() => toggleAccess(type)}
                onKeyDown={(e) => e.key === 'Enter' && toggleAccess(type)}
                className={cn(
                  'w-5 h-5 rounded border-2 flex items-center justify-center transition-all',
                  state.accessTypes.includes(type) ? 'bg-accent-cyan border-accent-cyan' : 'border-[rgba(255,255,255,0.2)] group-hover:border-[rgba(0,212,255,0.4)]'
                )}
              >
                {state.accessTypes.includes(type) && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
                    <path d="M1 4L3.5 6.5L9 1" stroke="#080B14" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </AriaCheckbox>
              <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">{type}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
