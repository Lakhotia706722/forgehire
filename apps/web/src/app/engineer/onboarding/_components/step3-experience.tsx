'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { OnboardingState, ExperienceEntry } from '@/lib/onboarding-store';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const YEARS  = Array.from({ length: 15 }, (_, i) => String(new Date().getFullYear() - i));

interface Step3Props {
  state: OnboardingState;
  onChange: (patch: Partial<OnboardingState>) => void;
}

function newEntry(): ExperienceEntry {
  return {
    id: crypto.randomUUID(),
    company: '', role: '',
    startMonth: 'Jan', startYear: String(new Date().getFullYear()),
    endMonth: 'Jan', endYear: String(new Date().getFullYear()),
    current: false, description: '',
    impact: [{ id: crypto.randomUUID(), key: '', value: '' }],
  };
}

export function Step3Experience({ state, onChange }: Step3Props) {
  function addEntry() {
    onChange({ experiences: [...state.experiences, newEntry()] });
  }

  function updateEntry(id: string, patch: Partial<ExperienceEntry>) {
    onChange({
      experiences: state.experiences.map((e) => e.id === id ? { ...e, ...patch } : e),
    });
  }

  function removeEntry(id: string) {
    onChange({ experiences: state.experiences.filter((e) => e.id !== id) });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-text-primary mb-1">Work Experience</h2>
        <p className="text-text-secondary text-sm">Add your relevant AI/ML work history.</p>
      </div>

      <div className="space-y-4" role="list" aria-label="Experience entries">
        {state.experiences.map((exp, idx) => (
          <ExperienceCard
            key={exp.id}
            exp={exp}
            index={idx}
            onUpdate={(patch) => updateEntry(exp.id, patch)}
            onRemove={() => removeEntry(exp.id)}
          />
        ))}
      </div>

      <Button variant="secondary" size="md" onClick={addEntry} type="button" className="w-full">
        + Add Experience
      </Button>

      {state.experiences.length === 0 && (
        <p className="text-center text-sm text-text-muted py-4">
          No experience added yet. Click above to add your first entry.
        </p>
      )}
    </div>
  );
}

function ExperienceCard({
  exp, index, onUpdate, onRemove,
}: {
  exp: ExperienceEntry;
  index: number;
  onUpdate: (patch: Partial<ExperienceEntry>) => void;
  onRemove: () => void;
}) {
  return (
    <div
      role="listitem"
      className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl p-5 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono text-text-muted">Experience {index + 1}</span>
        <button
          onClick={onRemove}
          aria-label="Remove experience"
          className="text-text-muted hover:text-accent-red transition-colors text-xs"
        >
          Remove
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Company"
          value={exp.company}
          onChange={(e) => onUpdate({ company: e.target.value })}
        />
        <Input
          label="Role / Title"
          value={exp.role}
          onChange={(e) => onUpdate({ role: e.target.value })}
        />
      </div>

      {/* Date range */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-text-muted mb-1.5">Start Date</label>
          <div className="flex gap-2">
            <select
              value={exp.startMonth}
              onChange={(e) => onUpdate({ startMonth: e.target.value })}
              className="flex-1 bg-bg-elevated border border-[rgba(255,255,255,0.06)] rounded-lg px-2 py-2 text-sm text-text-primary focus:outline-none focus:border-[rgba(0,212,255,0.3)]"
              aria-label="Start month"
            >
              {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <select
              value={exp.startYear}
              onChange={(e) => onUpdate({ startYear: e.target.value })}
              className="flex-1 bg-bg-elevated border border-[rgba(255,255,255,0.06)] rounded-lg px-2 py-2 text-sm text-text-primary focus:outline-none focus:border-[rgba(0,212,255,0.3)]"
              aria-label="Start year"
            >
              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs text-text-muted mb-1.5">End Date</label>
          {exp.current ? (
            <div className="flex items-center h-[38px] px-3 bg-bg-elevated border border-[rgba(255,255,255,0.06)] rounded-lg">
              <span className="text-sm text-accent-green">Present</span>
            </div>
          ) : (
            <div className="flex gap-2">
              <select
                value={exp.endMonth}
                onChange={(e) => onUpdate({ endMonth: e.target.value })}
                className="flex-1 bg-bg-elevated border border-[rgba(255,255,255,0.06)] rounded-lg px-2 py-2 text-sm text-text-primary focus:outline-none focus:border-[rgba(0,212,255,0.3)]"
                aria-label="End month"
              >
                {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              <select
                value={exp.endYear}
                onChange={(e) => onUpdate({ endYear: e.target.value })}
                className="flex-1 bg-bg-elevated border border-[rgba(255,255,255,0.06)] rounded-lg px-2 py-2 text-sm text-text-primary focus:outline-none focus:border-[rgba(0,212,255,0.3)]"
                aria-label="End year"
              >
                {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          )}
          <label className="flex items-center gap-2 mt-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={exp.current}
              onChange={(e) => onUpdate({ current: e.target.checked })}
              className="accent-accent-cyan"
            />
            <span className="text-xs text-text-muted">Currently working here</span>
          </label>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs text-text-muted mb-1.5">Description</label>
        <textarea
          value={exp.description}
          onChange={(e) => onUpdate({ description: e.target.value })}
          rows={3}
          placeholder="What did you build? What was your impact?"
          className="w-full bg-bg-elevated border border-[rgba(255,255,255,0.06)] rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,212,255,0.3)] resize-none transition-all"
        />
      </div>

      {/* Impact metrics */}
      <div>
        <label className="block text-xs text-text-muted mb-2">Impact Metrics</label>
        <div className="space-y-2">
          {exp.impact.map((item) => (
            <div key={item.id} className="flex gap-2 items-center">
              <input
                value={item.key}
                onChange={(e) => onUpdate({
                  impact: exp.impact.map((i) => i.id === item.id ? { ...i, key: e.target.value } : i),
                })}
                placeholder="Metric"
                className="flex-1 bg-bg-elevated border border-[rgba(255,255,255,0.06)] rounded-lg px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,212,255,0.3)]"
              />
              <input
                value={item.value}
                onChange={(e) => onUpdate({
                  impact: exp.impact.map((i) => i.id === item.id ? { ...i, value: e.target.value } : i),
                })}
                placeholder="Value (e.g. 40% reduction)"
                className="flex-1 bg-bg-elevated border border-[rgba(255,255,255,0.06)] rounded-lg px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,212,255,0.3)]"
              />
              <button
                onClick={() => onUpdate({ impact: exp.impact.filter((i) => i.id !== item.id) })}
                aria-label="Remove metric"
                className="text-text-muted hover:text-accent-red transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                  <path d="M1 1l10 10M11 1L1 11"/>
                </svg>
              </button>
            </div>
          ))}
          <button
            onClick={() => onUpdate({
              impact: [...exp.impact, { id: crypto.randomUUID(), key: '', value: '' }],
            })}
            className="text-xs text-accent-cyan hover:underline"
          >
            + Add metric
          </button>
        </div>
      </div>
    </div>
  );
}
