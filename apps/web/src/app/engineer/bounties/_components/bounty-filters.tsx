'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { RangeSlider } from '@/components/ui/range-slider';
import { formatReward } from '@/lib/bounty-data';
import type { TaskType, Difficulty } from '@/lib/bounty-data';

const TASK_TYPES: TaskType[] = ['Bounty', 'Direct', 'Contest'];
const DIFFICULTIES: Difficulty[] = ['Beginner', 'Intermediate', 'Advanced', 'Hard', 'Expert'];
const DEADLINE_OPTIONS = [
  { value: 'any',       label: 'Any time' },
  { value: 'this_week', label: 'This week' },
  { value: 'this_month',label: 'This month' },
];
const POPULAR_SKILLS = [
  'LLM', 'PyTorch', 'FastAPI', 'LangChain', 'HuggingFace',
  'Computer Vision', 'NLP', 'MLOps', 'RAG', 'Fine-tuning',
];

export interface FilterState {
  search: string;
  types: TaskType[];
  difficulties: Difficulty[];
  rewardRange: [number, number];
  skills: string[];
  eligibleOnly: boolean;
  deadline: string;
}

export const DEFAULT_FILTERS: FilterState = {
  search: '',
  types: [],
  difficulties: [],
  rewardRange: [0, 500000],
  skills: [],
  eligibleOnly: false,
  deadline: 'any',
};

interface BountyFiltersProps {
  filters: FilterState;
  onChange: (f: FilterState) => void;
  onApply: () => void;
  onReset: () => void;
}

export function BountyFilters({ filters, onChange, onApply, onReset }: BountyFiltersProps) {
  const [skillQuery, setSkillQuery] = React.useState('');

  function toggle<T>(arr: T[], val: T): T[] {
    return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
  }

  const filteredSkills = POPULAR_SKILLS.filter(
    (s) => s.toLowerCase().includes(skillQuery.toLowerCase()) && !filters.skills.includes(s)
  );

  return (
    <aside
      className="w-full space-y-6"
      aria-label="Bounty filters"
      data-testid="bounty-filters"
    >
      {/* Search */}
      <div>
        <label htmlFor="bounty-search" className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
          Search
        </label>
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <circle cx="6.5" cy="6.5" r="4.5"/><path d="M10.5 10.5l3 3"/>
          </svg>
          <input
            id="bounty-search"
            type="search"
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            placeholder="Search bounties..."
            className="w-full bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-lg pl-9 pr-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,212,255,0.3)] transition-all"
          />
        </div>
      </div>

      {/* Task type */}
      <div>
        <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">Type</p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Task type filter">
          {TASK_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={filters.types.includes(t)}
              onClick={() => onChange({ ...filters, types: toggle(filters.types, t) })}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-mono transition-all duration-150',
                filters.types.includes(t)
                  ? t === 'Bounty' ? 'bg-accent-cyan text-bg-base'
                    : t === 'Direct' ? 'bg-accent-violet text-white'
                    : 'bg-accent-amber text-bg-base'
                  : 'border border-[rgba(255,255,255,0.08)] text-text-muted hover:border-[rgba(255,255,255,0.2)] hover:text-text-secondary'
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Difficulty */}
      <div>
        <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">Difficulty</p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Difficulty filter">
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              type="button"
              aria-pressed={filters.difficulties.includes(d)}
              onClick={() => onChange({ ...filters, difficulties: toggle(filters.difficulties, d) })}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-mono transition-all duration-150',
                filters.difficulties.includes(d)
                  ? 'bg-[rgba(0,212,255,0.15)] text-accent-cyan border border-[rgba(0,212,255,0.3)]'
                  : 'border border-[rgba(255,255,255,0.08)] text-text-muted hover:border-[rgba(255,255,255,0.2)] hover:text-text-secondary'
              )}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Reward range */}
      <div>
        <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">Reward Range</p>
        <RangeSlider
          min={0}
          max={500000}
          step={5000}
          value={filters.rewardRange}
          onChange={(v) => onChange({ ...filters, rewardRange: v })}
          formatLabel={(v) => v === 0 ? '₹0' : `₹${(v / 1000).toFixed(0)}K`}
        />
      </div>

      {/* Skills */}
      <div>
        <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">Skills</p>
        {filters.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {filters.skills.map((s) => (
              <span
                key={s}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono bg-[rgba(0,212,255,0.08)] text-accent-cyan border border-[rgba(0,212,255,0.2)]"
              >
                {s}
                <button
                  onClick={() => onChange({ ...filters, skills: filters.skills.filter((x) => x !== s) })}
                  aria-label={`Remove ${s}`}
                  className="hover:text-accent-red transition-colors"
                >×</button>
              </span>
            ))}
          </div>
        )}
        <input
          type="text"
          value={skillQuery}
          onChange={(e) => setSkillQuery(e.target.value)}
          placeholder="Search skills..."
          className="w-full bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-lg px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,212,255,0.3)] mb-2 transition-all"
        />
        <div className="flex flex-wrap gap-1.5">
          {filteredSkills.slice(0, 8).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => { onChange({ ...filters, skills: [...filters.skills, s] }); setSkillQuery(''); }}
              className="text-[10px] px-2 py-0.5 rounded border border-[rgba(255,255,255,0.06)] text-text-muted hover:border-[rgba(0,212,255,0.3)] hover:text-accent-cyan transition-all"
            >
              + {s}
            </button>
          ))}
        </div>
      </div>

      {/* Eligible only toggle */}
      <label className="flex items-center gap-3 cursor-pointer group">
        <div
          className={cn(
            'relative w-10 h-5 rounded-full transition-colors duration-200',
            filters.eligibleOnly ? 'bg-accent-cyan' : 'bg-[rgba(255,255,255,0.1)]'
          )}
          onClick={() => onChange({ ...filters, eligibleOnly: !filters.eligibleOnly })}
          role="switch"
          aria-checked={filters.eligibleOnly}
          aria-label="Show eligible bounties only"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onChange({ ...filters, eligibleOnly: !filters.eligibleOnly })}
        >
          <div
            className={cn(
              'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200',
              filters.eligibleOnly ? 'translate-x-5' : 'translate-x-0.5'
            )}
          />
        </div>
        <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">
          Eligible only (my score)
        </span>
      </label>

      {/* Deadline */}
      <div>
        <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">Deadline</p>
        <div className="space-y-1.5" role="radiogroup" aria-label="Deadline filter">
          {DEADLINE_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer group">
              <div
                className={cn(
                  'w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all',
                  filters.deadline === opt.value
                    ? 'border-accent-cyan bg-accent-cyan'
                    : 'border-[rgba(255,255,255,0.2)] group-hover:border-[rgba(0,212,255,0.4)]'
                )}
                onClick={() => onChange({ ...filters, deadline: opt.value })}
                role="radio"
                aria-checked={filters.deadline === opt.value}
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && onChange({ ...filters, deadline: opt.value })}
              >
                {filters.deadline === opt.value && (
                  <div className="w-1.5 h-1.5 rounded-full bg-bg-base" />
                )}
              </div>
              <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">
                {opt.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2 pt-2 border-t border-[rgba(255,255,255,0.06)]">
        <Button size="md" className="w-full" onClick={onApply}>
          Apply Filters
        </Button>
        <button
          type="button"
          onClick={onReset}
          className="w-full text-sm text-text-muted hover:text-text-secondary transition-colors py-1"
        >
          Reset all
        </button>
      </div>
    </aside>
  );
}
