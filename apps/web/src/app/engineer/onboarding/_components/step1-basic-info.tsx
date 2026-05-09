'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import type { OnboardingState, WorkMode } from '@/lib/onboarding-store';

const WORK_MODES: { value: WorkMode; label: string; desc: string; icon: string }[] = [
  { value: 'remote',  label: 'Remote',  desc: 'Work from anywhere', icon: '🌍' },
  { value: 'hybrid',  label: 'Hybrid',  desc: 'Mix of remote & office', icon: '🏢' },
  { value: 'onsite',  label: 'On-site', desc: 'Office-based only', icon: '📍' },
];

const MAX_HEADLINE = 80;

interface Step1Props {
  state: OnboardingState;
  onChange: (patch: Partial<OnboardingState>) => void;
}

export function Step1BasicInfo({ state, onChange }: Step1Props) {
  const [dragOver, setDragOver] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => onChange({ photoUrl: e.target?.result as string });
    reader.readAsDataURL(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-text-primary mb-1">
          Let&apos;s build your profile
        </h2>
        <p className="text-text-secondary text-sm">
          This is what companies see first. Make it count.
        </p>
      </div>

      {/* Photo upload */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Profile Photo
        </label>
        <div className="flex items-center gap-5">
          {/* Preview */}
          <div
            className="w-20 h-20 rounded-full border-2 border-[rgba(0,212,255,0.3)] overflow-hidden flex items-center justify-center bg-bg-elevated shrink-0"
            aria-hidden="true"
          >
            {state.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={state.photoUrl} alt="Profile preview" className="w-full h-full object-cover" />
            ) : (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
              </svg>
            )}
          </div>

          {/* Drop zone */}
          <div
            className={cn(
              'flex-1 border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-200',
              dragOver
                ? 'border-accent-cyan bg-[rgba(0,212,255,0.06)] -translate-y-0.5'
                : 'border-[rgba(255,255,255,0.1)] hover:border-[rgba(0,212,255,0.3)] hover:bg-[rgba(0,212,255,0.03)] hover:-translate-y-0.5'
            )}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            role="button"
            tabIndex={0}
            aria-label="Upload profile photo"
            onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}
          >
            <p className="text-sm text-text-secondary">
              Drag & drop or <span className="text-accent-cyan">browse</span>
            </p>
            <p className="text-xs text-text-muted mt-1">JPG, PNG, WebP · Max 5MB</p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            aria-hidden="true"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
        </div>
      </div>

      {/* Full name */}
      <Input
        label="Full Name"
        value={state.fullName}
        onChange={(e) => onChange({ fullName: e.target.value })}
        autoComplete="name"
      />

      {/* Headline with char count */}
      <div>
        <div className="relative">
          <Input
            label="Professional Headline"
            value={state.headline}
            onChange={(e) => onChange({ headline: e.target.value.slice(0, MAX_HEADLINE) })}
            placeholder=" "
          />
          <span
            className={cn(
              'absolute right-3 bottom-2.5 text-xs font-mono transition-colors',
              state.headline.length > MAX_HEADLINE * 0.9
                ? 'text-accent-amber'
                : 'text-text-muted'
            )}
            aria-live="polite"
          >
            {state.headline.length}/{MAX_HEADLINE}
          </span>
        </div>
        <p className="text-xs text-text-muted mt-1">
          e.g. &quot;LLM Engineer · RAG Systems · Agentic AI&quot;
        </p>
      </div>

      {/* Location */}
      <Input
        label="City / Location"
        value={state.location}
        onChange={(e) => onChange({ location: e.target.value })}
        placeholder=" "
      />

      {/* Work mode */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-3">
          Work Mode Preference
        </label>
        <div className="grid grid-cols-3 gap-3" role="radiogroup" aria-label="Work mode preference">
          {WORK_MODES.map((mode) => (
            <button
              key={mode.value}
              type="button"
              role="radio"
              aria-checked={state.workMode === mode.value}
              onClick={() => onChange({ workMode: mode.value })}
              className={cn(
                'flex flex-col items-center gap-2 p-4 rounded-xl border text-center transition-all duration-200',
                state.workMode === mode.value
                  ? 'border-[rgba(0,212,255,0.5)] bg-[rgba(0,212,255,0.06)] text-text-primary'
                  : 'border-[rgba(255,255,255,0.06)] text-text-muted hover:border-[rgba(255,255,255,0.15)] hover:text-text-secondary'
              )}
            >
              <span className="text-2xl" aria-hidden="true">{mode.icon}</span>
              <span className="text-sm font-medium">{mode.label}</span>
              <span className="text-xs text-text-muted">{mode.desc}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
