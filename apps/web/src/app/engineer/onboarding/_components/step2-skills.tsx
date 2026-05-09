'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import type { OnboardingState, SkillEntry } from '@/lib/onboarding-store';

const POPULAR_SKILLS = [
  'LangChain', 'PyTorch', 'FastAPI', 'LlamaIndex', 'OpenAI API',
  'HuggingFace', 'Pinecone', 'Weaviate', 'vLLM', 'MLflow',
  'TensorFlow', 'Kubernetes', 'Docker', 'AWS SageMaker', 'Weights & Biases',
];

const PROFICIENCY_LABELS: Record<1 | 2 | 3, string> = {
  1: 'Beginner',
  2: 'Intermediate',
  3: 'Expert',
};

interface Step2Props {
  state: OnboardingState;
  onChange: (patch: Partial<OnboardingState>) => void;
}

export function Step2Skills({ state, onChange }: Step2Props) {
  const [query, setQuery] = React.useState('');
  const [suggestions, setSuggestions] = React.useState<string[]>([]);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout>>();

  // Debounced autocomplete
  React.useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!query.trim()) { setSuggestions([]); return; }
    debounceRef.current = setTimeout(() => {
      const q = query.toLowerCase();
      setSuggestions(
        POPULAR_SKILLS.filter(
          (s) => s.toLowerCase().includes(q) && !state.skills.find((sk) => sk.name === s)
        ).slice(0, 6)
      );
    }, 200);
    return () => clearTimeout(debounceRef.current);
  }, [query, state.skills]);

  function addSkill(name: string) {
    if (state.skills.find((s) => s.name === name)) return;
    const newSkill: SkillEntry = {
      id: crypto.randomUUID(),
      name,
      proficiency: 2,
      isPrimary: state.skills.length === 0,
    };
    onChange({ skills: [...state.skills, newSkill] });
    setQuery('');
    setSuggestions([]);
  }

  function removeSkill(id: string) {
    onChange({ skills: state.skills.filter((s) => s.id !== id) });
  }

  function setProficiency(id: string, proficiency: 1 | 2 | 3) {
    onChange({
      skills: state.skills.map((s) => s.id === id ? { ...s, proficiency } : s),
    });
  }

  function setPrimary(id: string) {
    onChange({
      skills: state.skills.map((s) => ({ ...s, isPrimary: s.id === id })),
    });
  }

  const available = POPULAR_SKILLS.filter((s) => !state.skills.find((sk) => sk.name === s));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-text-primary mb-1">Your AI Skills</h2>
        <p className="text-text-secondary text-sm">Add at least 3 skills. Set proficiency for each.</p>
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && query.trim()) {
              addSkill(query.trim());
            }
          }}
          placeholder="Search or type a skill..."
          className="w-full bg-bg-surface text-text-primary border border-[rgba(255,255,255,0.06)] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[rgba(0,212,255,0.3)] focus:shadow-[0_0_0_3px_rgba(0,212,255,0.1)] transition-all"
          aria-label="Search skills"
          aria-autocomplete="list"
          aria-controls="skill-suggestions"
        />
        {suggestions.length > 0 && (
          <div
            id="skill-suggestions"
            role="listbox"
            className="absolute top-full left-0 right-0 mt-1 bg-bg-elevated border border-[rgba(255,255,255,0.08)] rounded-xl shadow-xl z-20 overflow-hidden"
          >
            {suggestions.map((s) => (
              <button
                key={s}
                role="option"
                aria-selected={false}
                onClick={() => addSkill(s)}
                className="w-full text-left px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-[rgba(255,255,255,0.04)] transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected skills */}
      {state.skills.length > 0 && (
        <div className="space-y-2" role="list" aria-label="Selected skills">
          {state.skills.map((skill) => (
            <SkillChip
              key={skill.id}
              skill={skill}
              onRemove={() => removeSkill(skill.id)}
              onProficiency={(p) => setProficiency(skill.id, p)}
              onSetPrimary={() => setPrimary(skill.id)}
            />
          ))}
        </div>
      )}

      {/* Popular suggestions */}
      <div>
        <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">
          Popular for AI Engineers
        </p>
        <div className="flex flex-wrap gap-2">
          {available.slice(0, 10).map((s) => (
            <button
              key={s}
              onClick={() => addSkill(s)}
              className="px-3 py-1.5 rounded-lg text-xs font-mono text-text-muted border border-[rgba(255,255,255,0.08)] hover:border-[rgba(0,212,255,0.3)] hover:text-accent-cyan transition-all duration-150"
            >
              + {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function SkillChip({
  skill,
  onRemove,
  onProficiency,
  onSetPrimary,
}: {
  skill: SkillEntry;
  onRemove: () => void;
  onProficiency: (p: 1 | 2 | 3) => void;
  onSetPrimary: () => void;
}) {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <div
      role="listitem"
      className={cn(
        'flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all duration-200',
        skill.isPrimary
          ? 'border-[rgba(245,158,11,0.4)] bg-[rgba(245,158,11,0.06)]'
          : 'border-[rgba(255,255,255,0.08)] bg-bg-elevated'
      )}
    >
      {/* Primary star */}
      <button
        onClick={onSetPrimary}
        title={skill.isPrimary ? 'Primary skill' : 'Set as primary'}
        aria-label={skill.isPrimary ? 'Primary skill' : 'Set as primary skill'}
        className={cn(
          'shrink-0 transition-colors',
          skill.isPrimary ? 'text-accent-amber' : 'text-text-muted hover:text-accent-amber'
        )}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill={skill.isPrimary ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <path d="M8 1l1.8 3.6L14 5.6l-3 2.9.7 4.1L8 10.5l-3.7 2.1.7-4.1-3-2.9 4.2-.6L8 1z"/>
        </svg>
      </button>

      {/* Name */}
      <span className="flex-1 text-sm font-medium text-text-primary">{skill.name}</span>

      {/* Proficiency dots */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="flex items-center gap-1.5 group"
        aria-label={`Proficiency: ${PROFICIENCY_LABELS[skill.proficiency]}`}
        aria-expanded={expanded}
      >
        {([1, 2, 3] as const).map((d) => (
          <div
            key={d}
            className={cn(
              'w-2 h-2 rounded-full transition-colors',
              d <= skill.proficiency ? 'bg-accent-cyan' : 'bg-[rgba(255,255,255,0.1)]'
            )}
          />
        ))}
        <span className="text-xs text-text-muted ml-1 group-hover:text-text-secondary">
          {PROFICIENCY_LABELS[skill.proficiency]}
        </span>
      </button>

      {/* Proficiency selector (expanded) */}
      {expanded && (
        <div className="flex gap-1">
          {([1, 2, 3] as const).map((p) => (
            <button
              key={p}
              onClick={() => { onProficiency(p); setExpanded(false); }}
              className={cn(
                'px-2 py-0.5 rounded text-xs font-mono transition-colors',
                skill.proficiency === p
                  ? 'bg-accent-cyan text-bg-base'
                  : 'text-text-muted hover:text-text-secondary'
              )}
              aria-label={PROFICIENCY_LABELS[p]}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Remove */}
      <button
        onClick={onRemove}
        aria-label={`Remove ${skill.name}`}
        className="text-text-muted hover:text-accent-red transition-colors ml-1"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
          <path d="M1 1l12 12M13 1L1 13"/>
        </svg>
      </button>
    </div>
  );
}
