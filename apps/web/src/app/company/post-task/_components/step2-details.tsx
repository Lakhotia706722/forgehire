'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { TASK_CATEGORIES } from '@/lib/bounty-data';
import type { PostTaskState } from '@/lib/bounty-data';

interface Step2Props {
  state: PostTaskState;
  onChange: (patch: Partial<PostTaskState>) => void;
}

export function Step2Details({ state, onChange }: Step2Props) {
  const [techInput, setTechInput] = React.useState('');

  function toggleCategory(cat: string) {
    const cats = state.categories.includes(cat)
      ? state.categories.filter((c) => c !== cat)
      : [...state.categories, cat];
    onChange({ categories: cats });
  }

  function addDeliverable() {
    onChange({
      deliverables: [
        ...state.deliverables,
        { id: crypto.randomUUID(), title: '', description: '', required: true },
      ],
    });
  }

  function updateDeliverable(id: string, field: string, val: string | boolean) {
    onChange({
      deliverables: state.deliverables.map((d) => d.id === id ? { ...d, [field]: val } : d),
    });
  }

  function removeDeliverable(id: string) {
    onChange({ deliverables: state.deliverables.filter((d) => d.id !== id) });
  }

  function addTech(name: string) {
    if (!name.trim() || state.techRequirements.includes(name.trim())) return;
    onChange({ techRequirements: [...state.techRequirements, name.trim()] });
    setTechInput('');
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-text-primary mb-1">Task Details</h2>
        <p className="text-text-secondary text-sm">Be specific — better descriptions attract better engineers.</p>
      </div>

      <Input
        label="Task Title *"
        value={state.title}
        onChange={(e) => onChange({ title: e.target.value })}
      />

      {/* Categories */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">Categories</label>
        <div className="flex flex-wrap gap-2">
          {TASK_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              aria-pressed={state.categories.includes(cat)}
              onClick={() => toggleCategory(cat)}
              className={cn(
                'text-xs px-3 py-1.5 rounded-full border transition-all duration-150',
                state.categories.includes(cat)
                  ? 'bg-[rgba(0,212,255,0.1)] text-accent-cyan border-[rgba(0,212,255,0.3)]'
                  : 'border-[rgba(255,255,255,0.08)] text-text-muted hover:border-[rgba(255,255,255,0.2)] hover:text-text-secondary'
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Problem statement */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">Problem Statement *</label>
        <RichTextEditor
          value={state.problemStatement}
          onChange={(v) => onChange({ problemStatement: v })}
          placeholder="Describe the problem you're trying to solve..."
          minHeight={140}
        />
      </div>

      {/* Current state */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">Current State</label>
        <textarea
          value={state.currentState}
          onChange={(e) => onChange({ currentState: e.target.value })}
          rows={3}
          placeholder="What exists today? What's the baseline?"
          className="w-full bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,212,255,0.3)] resize-none transition-all"
        />
      </div>

      {/* Expected outcome */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">Expected Outcome *</label>
        <textarea
          value={state.expectedOutcome}
          onChange={(e) => onChange({ expectedOutcome: e.target.value })}
          rows={3}
          placeholder="What does success look like? Be specific with metrics."
          className="w-full bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,212,255,0.3)] resize-none transition-all"
        />
      </div>

      {/* Deliverables */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">Deliverables</label>
        <div className="space-y-2 mb-2">
          {state.deliverables.map((d, i) => (
            <div key={d.id} className="flex gap-2 items-start bg-bg-elevated border border-[rgba(255,255,255,0.06)] rounded-xl p-3">
              <span className="text-xs font-mono text-text-muted mt-2.5 shrink-0 w-5">{i + 1}.</span>
              <div className="flex-1 space-y-2">
                <input
                  value={d.title}
                  onChange={(e) => updateDeliverable(d.id, 'title', e.target.value)}
                  placeholder="Deliverable title"
                  className="w-full bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,212,255,0.3)]"
                />
                <input
                  value={d.description}
                  onChange={(e) => updateDeliverable(d.id, 'description', e.target.value)}
                  placeholder="Description / acceptance criteria"
                  className="w-full bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-lg px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,212,255,0.3)]"
                />
              </div>
              <button onClick={() => removeDeliverable(d.id)} className="text-text-muted hover:text-accent-red transition-colors mt-2" aria-label="Remove deliverable">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><path d="M1 1l12 12M13 1L1 13"/></svg>
              </button>
            </div>
          ))}
        </div>
        <button onClick={addDeliverable} className="text-sm text-accent-cyan hover:underline">+ Add deliverable</button>
      </div>

      {/* Tech requirements */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">Tech Requirements</label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {state.techRequirements.map((t) => (
            <span key={t} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono bg-[rgba(0,212,255,0.08)] text-accent-cyan border border-[rgba(0,212,255,0.2)]">
              {t}
              <button onClick={() => onChange({ techRequirements: state.techRequirements.filter((x) => x !== t) })} aria-label={`Remove ${t}`} className="hover:text-accent-red">×</button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={techInput}
            onChange={(e) => setTechInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTech(techInput); } }}
            placeholder="Add tech (press Enter)"
            className="flex-1 bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,212,255,0.3)]"
          />
        </div>
      </div>
    </div>
  );
}
