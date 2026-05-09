'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import type { PostTaskState, ContestPrizeTier } from '@/lib/bounty-data';

interface Step3Props {
  state: PostTaskState;
  onChange: (patch: Partial<PostTaskState>) => void;
}

export function Step3TimelineReward({ state, onChange }: Step3Props) {
  const totalReward = parseFloat(state.rewardAmount) || 0;

  // Sync prize amounts from percentages
  function updatePrizePercentage(id: string, pct: number) {
    const prizes = state.contestPrizes.map((p) =>
      p.id === id
        ? { ...p, percentage: pct, amount: Math.round((totalReward * pct) / 100) }
        : p
    );
    onChange({ contestPrizes: prizes });
  }

  function addPrizeTier() {
    const newRank = state.contestPrizes.length + 1;
    onChange({
      contestPrizes: [
        ...state.contestPrizes,
        { id: crypto.randomUUID(), rank: newRank, label: `${newRank}${['st','nd','rd'][newRank-1] || 'th'} Place`, amount: 0, percentage: 0 },
      ],
    });
  }

  function removePrizeTier(id: string) {
    onChange({ contestPrizes: state.contestPrizes.filter((p) => p.id !== id) });
  }

  // Validate: sum of percentages must equal 100
  const totalPct = state.contestPrizes.reduce((sum, p) => sum + p.percentage, 0);
  const pctValid = state.type !== 'Contest' || totalPct === 100;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-text-primary mb-1">Timeline & Reward</h2>
        <p className="text-text-secondary text-sm">Set your budget and timeline.</p>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-text-muted mb-1.5">Start Date</label>
          <input
            type="date"
            value={state.startDate}
            onChange={(e) => onChange({ startDate: e.target.value })}
            className="w-full bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-[rgba(0,212,255,0.3)] transition-all [color-scheme:dark]"
            aria-label="Start date"
          />
        </div>
        <div>
          <label className="block text-xs text-text-muted mb-1.5">Deadline *</label>
          <input
            type="date"
            value={state.deadline}
            onChange={(e) => onChange({ deadline: e.target.value })}
            className="w-full bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-[rgba(0,212,255,0.3)] transition-all [color-scheme:dark]"
            aria-label="Deadline"
          />
        </div>
      </div>

      {/* Reward amount */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">
          {state.type === 'Contest' ? 'Total Prize Pool *' : 'Reward Amount *'}
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-text-muted pointer-events-none">₹</span>
          <input
            type="number"
            value={state.rewardAmount}
            onChange={(e) => onChange({ rewardAmount: e.target.value })}
            placeholder="0"
            min="0"
            className="w-full bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl pl-10 pr-4 py-3 font-mono text-xl text-text-primary focus:outline-none focus:border-[rgba(0,212,255,0.3)] transition-all"
            aria-label="Reward amount in rupees"
            data-testid="reward-amount-input"
          />
        </div>
      </div>

      {/* Payment type (non-contest) */}
      {state.type !== 'Contest' && (
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">Payment Type</label>
          <div className="flex gap-2" role="radiogroup" aria-label="Payment type">
            {(['fixed', 'milestone', 'hourly'] as const).map((pt) => (
              <button
                key={pt}
                type="button"
                role="radio"
                aria-checked={state.paymentType === pt}
                onClick={() => onChange({ paymentType: pt })}
                className={cn(
                  'flex-1 py-2.5 rounded-xl text-sm font-medium transition-all',
                  state.paymentType === pt
                    ? 'bg-accent-cyan text-bg-base'
                    : 'border border-[rgba(255,255,255,0.08)] text-text-muted hover:text-text-secondary'
                )}
              >
                {pt.charAt(0).toUpperCase() + pt.slice(1)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Contest prize tiers */}
      {state.type === 'Contest' && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-text-secondary">Prize Tiers</label>
            {!pctValid && (
              <span className="text-xs text-accent-red font-mono" data-testid="pct-error">
                Total: {totalPct}% (must equal 100%)
              </span>
            )}
            {pctValid && totalPct === 100 && (
              <span className="text-xs text-accent-green font-mono">✓ 100%</span>
            )}
          </div>

          <div className="space-y-3">
            {state.contestPrizes.map((prize) => (
              <PrizeTierRow
                key={prize.id}
                prize={prize}
                totalReward={totalReward}
                onPercentageChange={(pct) => updatePrizePercentage(prize.id, pct)}
                onLabelChange={(label) => onChange({
                  contestPrizes: state.contestPrizes.map((p) => p.id === prize.id ? { ...p, label } : p),
                })}
                onRemove={() => removePrizeTier(prize.id)}
                canRemove={state.contestPrizes.length > 1}
              />
            ))}
          </div>

          <button
            onClick={addPrizeTier}
            className="mt-3 text-sm text-accent-cyan hover:underline"
            data-testid="add-prize-tier-btn"
          >
            + Add prize tier
          </button>
        </div>
      )}
    </div>
  );
}

function PrizeTierRow({
  prize, totalReward, onPercentageChange, onLabelChange, onRemove, canRemove,
}: {
  prize: ContestPrizeTier;
  totalReward: number;
  onPercentageChange: (pct: number) => void;
  onLabelChange: (label: string) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const amount = totalReward > 0 ? Math.round((totalReward * prize.percentage) / 100) : 0;

  return (
    <div className="flex items-center gap-3 bg-bg-elevated border border-[rgba(255,255,255,0.06)] rounded-xl p-3">
      <div className="w-8 h-8 rounded-lg bg-[rgba(245,158,11,0.1)] flex items-center justify-center shrink-0">
        <span className="text-xs font-mono text-accent-amber">{prize.rank}</span>
      </div>
      <input
        value={prize.label}
        onChange={(e) => onLabelChange(e.target.value)}
        className="flex-1 bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-lg px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-[rgba(0,212,255,0.3)]"
        aria-label={`Prize tier ${prize.rank} label`}
      />
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          value={prize.percentage}
          onChange={(e) => onPercentageChange(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
          min="0"
          max="100"
          className="w-16 bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-lg px-2 py-1.5 text-sm text-text-primary font-mono text-center focus:outline-none focus:border-[rgba(0,212,255,0.3)]"
          aria-label={`Prize tier ${prize.rank} percentage`}
          data-testid={`prize-pct-${prize.rank}`}
        />
        <span className="text-xs text-text-muted">%</span>
      </div>
      {totalReward > 0 && (
        <span className="text-sm font-mono text-accent-amber shrink-0">
          ₹{amount.toLocaleString('en-IN')}
        </span>
      )}
      {canRemove && (
        <button onClick={onRemove} className="text-text-muted hover:text-accent-red transition-colors" aria-label="Remove prize tier">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><path d="M1 1l12 12M13 1L1 13"/></svg>
        </button>
      )}
    </div>
  );
}
