'use client';
import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { OnboardingState, ProjectEntry, ProjectType } from '@/lib/onboarding-store';

const PROJECT_TYPES: ProjectType[] = ['Agent', 'SaaS', 'API', 'Tool', 'Model'];

const POPULAR_TECH = [
  'LangChain', 'PyTorch', 'FastAPI', 'OpenAI', 'HuggingFace',
  'Pinecone', 'Docker', 'AWS', 'PostgreSQL', 'Redis',
];

interface Step4Props {
  state: OnboardingState;
  onChange: (patch: Partial<OnboardingState>) => void;
}

function newProject(): ProjectEntry {
  return {
    id: crypto.randomUUID(),
    title: '', type: 'Agent',
    problemSolved: '', description: '',
    techStack: [], demoUrl: '', githubUrl: '',
    screenshots: [],
    metrics: { accuracy: '', timeSaved: '', usersServed: '' },
  };
}

function isProjectComplete(p: ProjectEntry): boolean {
  return !!(p.title && p.description && p.techStack.length > 0);
}

export function Step4Projects({ state, onChange }: Step4Props) {
  function addProject() {
    onChange({ projects: [...state.projects, newProject()] });
  }

  function updateProject(id: string, patch: Partial<ProjectEntry>) {
    onChange({
      projects: state.projects.map((p) => p.id === id ? { ...p, ...patch } : p),
    });
  }

  function removeProject(id: string) {
    onChange({ projects: state.projects.filter((p) => p.id !== id) });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-text-primary mb-1">Your Projects</h2>
        <p className="text-text-secondary text-sm">
          Show what you&apos;ve built. At least 1 project required.
        </p>
      </div>

      <div className="space-y-4" role="list" aria-label="Project entries">
        {state.projects.map((project, idx) => (
          <ProjectCard
            key={project.id}
            project={project}
            index={idx}
            onUpdate={(patch) => updateProject(project.id, patch)}
            onRemove={() => removeProject(project.id)}
          />
        ))}
      </div>

      {state.projects.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed border-[rgba(255,255,255,0.08)] rounded-xl">
          <p className="text-text-muted text-sm mb-3">No projects yet. Add at least one.</p>
          <Button variant="secondary" size="sm" onClick={addProject} type="button">
            + Add Your First Project
          </Button>
        </div>
      )}

      {state.projects.length > 0 && (
        <Button variant="secondary" size="md" onClick={addProject} type="button" className="w-full">
          + Add Another Project
        </Button>
      )}
    </div>
  );
}

function ProjectCard({
  project: p, index, onUpdate, onRemove,
}: {
  project: ProjectEntry;
  index: number;
  onUpdate: (patch: Partial<ProjectEntry>) => void;
  onRemove: () => void;
}) {
  const [techInput, setTechInput] = React.useState('');
  const complete = isProjectComplete(p);

  function addTech(name: string) {
    if (!name.trim() || p.techStack.includes(name.trim())) return;
    onUpdate({ techStack: [...p.techStack, name.trim()] });
    setTechInput('');
  }

  return (
    <div
      role="listitem"
      className={cn(
        'bg-bg-surface rounded-xl p-5 space-y-4 border-l-4 transition-colors',
        complete
          ? 'border-l-[rgba(0,212,255,0.4)] border border-[rgba(255,255,255,0.06)]'
          : 'border-l-accent-amber border border-[rgba(245,158,11,0.15)]'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-text-muted">Project {index + 1}</span>
          {!complete && (
            <span className="text-xs text-accent-amber">· Fill required fields</span>
          )}
        </div>
        <button
          onClick={onRemove}
          aria-label="Remove project"
          className="text-text-muted hover:text-accent-red transition-colors text-xs"
        >
          Remove
        </button>
      </div>

      {/* Title */}
      <Input
        label="Project Title *"
        value={p.title}
        onChange={(e) => onUpdate({ title: e.target.value })}
      />

      {/* Type selector */}
      <div>
        <label className="block text-xs text-text-muted mb-2">Project Type *</label>
        <div className="flex gap-2 flex-wrap" role="radiogroup" aria-label="Project type">
          {PROJECT_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              role="radio"
              aria-checked={p.type === type ? "true" : "false"}
              onClick={() => onUpdate({ type })}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-mono transition-all duration-150',
                p.type === type
                  ? 'bg-accent-cyan text-bg-base font-semibold'
                  : 'border border-[rgba(255,255,255,0.08)] text-text-muted hover:border-[rgba(0,212,255,0.3)] hover:text-accent-cyan'
              )}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Problem solved */}
      <div>
        <label className="block text-xs text-text-muted mb-1.5">Problem Solved</label>
        <textarea
          value={p.problemSolved}
          onChange={(e) => onUpdate({ problemSolved: e.target.value })}
          rows={2}
          placeholder="What problem does this solve?"
          className="w-full bg-bg-elevated border border-[rgba(255,255,255,0.06)] rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,212,255,0.3)] resize-none transition-all"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs text-text-muted mb-1.5">Description *</label>
        <textarea
          value={p.description}
          onChange={(e) => onUpdate({ description: e.target.value })}
          rows={3}
          placeholder="Describe what you built and how..."
          className="w-full bg-bg-elevated border border-[rgba(255,255,255,0.06)] rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,212,255,0.3)] resize-none transition-all"
        />
      </div>

      {/* Tech stack */}
      <div>
        <label className="block text-xs text-text-muted mb-2">Tech Stack *</label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {p.techStack.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono bg-[rgba(0,212,255,0.08)] text-accent-cyan border border-[rgba(0,212,255,0.2)]"
            >
              {t}
              <button
                onClick={() => onUpdate({ techStack: p.techStack.filter((x) => x !== t) })}
                aria-label={`Remove ${t}`}
                className="hover:text-accent-red transition-colors"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={techInput}
            onChange={(e) => setTechInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTech(techInput); } }}
            placeholder="Add tech (press Enter)"
            className="flex-1 bg-bg-elevated border border-[rgba(255,255,255,0.06)] rounded-lg px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,212,255,0.3)]"
          />
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {POPULAR_TECH.filter((t) => !p.techStack.includes(t)).slice(0, 6).map((t) => (
            <button
              key={t}
              onClick={() => addTech(t)}
              className="text-[10px] px-2 py-0.5 rounded border border-[rgba(255,255,255,0.06)] text-text-muted hover:border-[rgba(0,212,255,0.3)] hover:text-accent-cyan transition-all"
            >
              + {t}
            </button>
          ))}
        </div>
      </div>

      {/* URLs */}
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Demo URL"
          value={p.demoUrl}
          onChange={(e) => onUpdate({ demoUrl: e.target.value })}
          type="url"
        />
        <Input
          label="GitHub URL"
          value={p.githubUrl}
          onChange={(e) => onUpdate({ githubUrl: e.target.value })}
          type="url"
        />
      </div>

      {/* Metrics */}
      <div>
        <label className="block text-xs text-text-muted mb-2">Performance Metrics (optional)</label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { key: 'accuracy',    label: 'Accuracy %' },
            { key: 'timeSaved',   label: 'Time Saved' },
            { key: 'usersServed', label: 'Users Served' },
          ].map(({ key, label }) => (
            <input
              key={key}
              value={p.metrics[key as keyof typeof p.metrics]}
              onChange={(e) => onUpdate({ metrics: { ...p.metrics, [key]: e.target.value } })}
              placeholder={label}
              className="bg-bg-elevated border border-[rgba(255,255,255,0.06)] rounded-lg px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,212,255,0.3)]"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
