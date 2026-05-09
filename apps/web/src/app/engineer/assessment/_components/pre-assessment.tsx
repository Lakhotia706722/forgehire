'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';

interface PreAssessmentProps {
  onBegin: () => void;
}

const CHECKLIST = [
  { id: 'quiet',      label: 'I am in a quiet environment with no distractions' },
  { id: 'tabs',       label: 'I will not switch tabs or open other windows during the test' },
  { id: 'fullscreen', label: 'I allow the test to run in fullscreen mode' },
  { id: 'time',       label: 'I have 90 uninterrupted minutes available right now' },
];

export function PreAssessment({ onBegin }: PreAssessmentProps) {
  const [checked, setChecked] = React.useState<Record<string, boolean>>({});

  const allChecked = CHECKLIST.every((item) => checked[item.id]);

  function toggle(id: string) {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-lg space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[rgba(0,212,255,0.2)] bg-[rgba(0,212,255,0.05)] mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan animate-pulse" />
            <span className="text-xs font-mono text-accent-cyan uppercase tracking-wider">NeuronScore Assessment</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-text-primary mb-3">
            Ready to get verified?
          </h1>
          <p className="text-text-secondary text-sm leading-relaxed">
            This is a one-time, 90-minute assessment. Your score determines your NeuronScore tier.
          </p>
        </div>

        {/* Overview */}
        <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl p-5 space-y-3">
          <h2 className="font-display font-semibold text-text-primary text-sm">Assessment Overview</h2>
          {[
            { section: 'MCQ',      duration: '30 min', desc: '30 multiple-choice questions on AI/ML concepts' },
            { section: 'Coding',   duration: '45 min', desc: '3 coding tasks in Python' },
            { section: 'Scenario', duration: '15 min', desc: '1 open-ended case scenario' },
          ].map((s) => (
            <div key={s.section} className="flex items-start gap-3">
              <span className="font-mono text-xs text-accent-cyan bg-[rgba(0,212,255,0.08)] px-2 py-0.5 rounded shrink-0 mt-0.5">
                {s.section}
              </span>
              <div>
                <span className="text-sm text-text-primary">{s.duration}</span>
                <span className="text-text-muted mx-2">·</span>
                <span className="text-sm text-text-secondary">{s.desc}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Warning */}
        <div className="flex gap-3 p-4 bg-[rgba(239,68,68,0.06)] border border-[rgba(239,68,68,0.2)] rounded-xl">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="#EF4444" className="shrink-0 mt-0.5" aria-hidden="true">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
          </svg>
          <div>
            <p className="text-sm font-medium text-accent-red">Proctoring Active</p>
            <p className="text-xs text-text-secondary mt-0.5">
              This assessment uses proctoring. Tab switches, copy-paste, and inactivity are monitored. Violations may result in automatic submission.
            </p>
          </div>
        </div>

        {/* Checklist */}
        <div className="space-y-3" role="group" aria-label="Pre-assessment checklist">
          <p className="text-sm font-medium text-text-secondary">Before you begin, confirm:</p>
          {CHECKLIST.map((item) => (
            <label
              key={item.id}
              className="flex items-start gap-3 cursor-pointer group"
            >
              <div className="relative mt-0.5 shrink-0">
                <input
                  type="checkbox"
                  checked={!!checked[item.id]}
                  onChange={() => toggle(item.id)}
                  className="sr-only"
                  aria-label={item.label}
                />
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-150 ${
                    checked[item.id]
                      ? 'bg-accent-cyan border-accent-cyan'
                      : 'border-[rgba(255,255,255,0.2)] group-hover:border-[rgba(0,212,255,0.4)]'
                  }`}
                >
                  {checked[item.id] && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
                      <path d="M1 4L3.5 6.5L9 1" stroke="#080B14" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
              </div>
              <span className={`text-sm transition-colors ${checked[item.id] ? 'text-text-primary' : 'text-text-secondary'}`}>
                {item.label}
              </span>
            </label>
          ))}
        </div>

        {/* CTA */}
        <Button
          size="lg"
          className="w-full"
          disabled={!allChecked}
          onClick={onBegin}
          data-testid="begin-assessment-btn"
        >
          Begin Assessment
        </Button>

        {!allChecked && (
          <p className="text-center text-xs text-text-muted">
            Check all boxes above to enable the button
          </p>
        )}
      </div>
    </div>
  );
}
