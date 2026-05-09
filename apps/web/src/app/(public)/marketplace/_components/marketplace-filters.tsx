'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { RangeSlider } from '@/components/ui/range-slider';
import type { AIModel, PricingModel } from '@/lib/marketplace-data';

const AI_MODELS: AIModel[] = ['GPT-4', 'Claude', 'Llama', 'Open-source', 'Custom'];
const PRICING_MODELS: { value: PricingModel; label: string }[] = [
  { value: 'one_time',     label: 'One-time' },
  { value: 'subscription', label: 'Subscription' },
  { value: 'freemium',     label: 'Freemium' },
  { value: 'per_call',     label: 'Per-call' },
];

export interface MarketplaceFilterState {
  priceRange: [number, number];
  aiModels: AIModel[];
  minRating: number;
  minNeuronScore: number;
  tryBeforeBuy: boolean;
  pricingModels: PricingModel[];
}

export const DEFAULT_MARKET_FILTERS: MarketplaceFilterState = {
  priceRange: [0, 50000],
  aiModels: [],
  minRating: 0,
  minNeuronScore: 0,
  tryBeforeBuy: false,
  pricingModels: [],
};

interface Props {
  filters: MarketplaceFilterState;
  onChange: (f: MarketplaceFilterState) => void;
  onApply: () => void;
  onReset: () => void;
}

export function MarketplaceFilters({ filters, onChange, onApply, onReset }: Props) {
  function toggleAIModel(m: AIModel) {
    const next = filters.aiModels.includes(m)
      ? filters.aiModels.filter((x) => x !== m)
      : [...filters.aiModels, m];
    onChange({ ...filters, aiModels: next });
  }

  function togglePricingModel(m: PricingModel) {
    const next = filters.pricingModels.includes(m)
      ? filters.pricingModels.filter((x) => x !== m)
      : [...filters.pricingModels, m];
    onChange({ ...filters, pricingModels: next });
  }

  return (
    <aside className="space-y-6" aria-label="Marketplace filters" data-testid="marketplace-filters">
      {/* Price range */}
      <div>
        <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">Price Range</p>
        <RangeSlider
          min={0}
          max={50000}
          step={500}
          value={filters.priceRange}
          onChange={(v) => onChange({ ...filters, priceRange: v })}
          formatLabel={(v) => v === 0 ? 'Free' : `₹${(v / 1000).toFixed(0)}K`}
        />
      </div>

      {/* AI model */}
      <div>
        <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">AI Model Used</p>
        <div className="space-y-2">
          {AI_MODELS.map((m) => (
            <label key={m} className="flex items-center gap-2.5 cursor-pointer group">
              <div
                className={cn(
                  'w-4 h-4 rounded border-2 flex items-center justify-center transition-all',
                  filters.aiModels.includes(m)
                    ? 'bg-accent-cyan border-accent-cyan'
                    : 'border-[rgba(255,255,255,0.2)] group-hover:border-[rgba(0,212,255,0.4)]'
                )}
                onClick={() => toggleAIModel(m)}
                role="checkbox"
                aria-checked={filters.aiModels.includes(m)}
                aria-label={m}
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && toggleAIModel(m)}
              >
                {filters.aiModels.includes(m) && (
                  <svg width="8" height="6" viewBox="0 0 10 8" fill="none" aria-hidden="true">
                    <path d="M1 4L3.5 6.5L9 1" stroke="#080B14" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">{m}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Rating */}
      <div>
        <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">Minimum Rating</p>
        <label className="flex items-center gap-3 cursor-pointer group">
          <div
            className={cn(
              'relative w-10 h-5 rounded-full transition-colors duration-200 cursor-pointer',
              filters.minRating >= 4 ? 'bg-accent-cyan' : 'bg-[rgba(255,255,255,0.1)]'
            )}
            onClick={() => onChange({ ...filters, minRating: filters.minRating >= 4 ? 0 : 4 })}
            role="switch"
            aria-checked={filters.minRating >= 4}
            aria-label="4+ stars only"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onChange({ ...filters, minRating: filters.minRating >= 4 ? 0 : 4 })}
          >
            <div className={cn('absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200', filters.minRating >= 4 ? 'translate-x-5' : 'translate-x-0.5')} />
          </div>
          <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors flex items-center gap-1">
            <span className="text-accent-amber">★★★★</span> 4+ stars only
          </span>
        </label>
      </div>

      {/* NeuronScore */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider">Min Engineer Score</p>
          <span className="text-xs font-mono text-accent-cyan">{filters.minNeuronScore}</span>
        </div>
        <input
          type="range"
          min={0}
          max={1000}
          step={50}
          value={filters.minNeuronScore}
          onChange={(e) => onChange({ ...filters, minNeuronScore: parseInt(e.target.value) })}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #00D4FF 0%, #00D4FF ${(filters.minNeuronScore / 1000) * 100}%, rgba(255,255,255,0.08) ${(filters.minNeuronScore / 1000) * 100}%, rgba(255,255,255,0.08) 100%)`,
          }}
          aria-label="Minimum engineer NeuronScore"
        />
      </div>

      {/* Try before buy */}
      <label className="flex items-center gap-3 cursor-pointer group">
        <div
          className={cn(
            'relative w-10 h-5 rounded-full transition-colors duration-200 cursor-pointer',
            filters.tryBeforeBuy ? 'bg-accent-cyan' : 'bg-[rgba(255,255,255,0.1)]'
          )}
          onClick={() => onChange({ ...filters, tryBeforeBuy: !filters.tryBeforeBuy })}
          role="switch"
          aria-checked={filters.tryBeforeBuy}
          aria-label="Try before buy available"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onChange({ ...filters, tryBeforeBuy: !filters.tryBeforeBuy })}
        >
          <div className={cn('absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200', filters.tryBeforeBuy ? 'translate-x-5' : 'translate-x-0.5')} />
        </div>
        <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">Try before buy</span>
      </label>

      {/* Pricing model */}
      <div>
        <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">Pricing Model</p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Pricing model filter">
          {PRICING_MODELS.map((pm) => (
            <button
              key={pm.value}
              type="button"
              aria-pressed={filters.pricingModels.includes(pm.value)}
              onClick={() => togglePricingModel(pm.value)}
              className={cn(
                'text-xs px-3 py-1.5 rounded-full border transition-all duration-150',
                filters.pricingModels.includes(pm.value)
                  ? 'bg-[rgba(0,212,255,0.1)] text-accent-cyan border-[rgba(0,212,255,0.3)]'
                  : 'border-[rgba(255,255,255,0.08)] text-text-muted hover:border-[rgba(255,255,255,0.2)] hover:text-text-secondary'
              )}
            >
              {pm.label}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2 pt-2 border-t border-[rgba(255,255,255,0.06)]">
        <button
          onClick={onApply}
          className="w-full py-2.5 rounded-lg bg-accent-cyan text-bg-base text-sm font-semibold hover:brightness-110 transition-all active:scale-[0.97]"
        >
          Apply Filters
        </button>
        <button
          onClick={onReset}
          className="w-full text-sm text-text-muted hover:text-text-secondary transition-colors py-1"
        >
          Reset all
        </button>
      </div>
    </aside>
  );
}
