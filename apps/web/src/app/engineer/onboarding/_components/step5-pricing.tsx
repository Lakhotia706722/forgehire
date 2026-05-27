'use client';
import * as React from 'react';
import { cn } from '@/lib/utils';
import type { OnboardingState, AvailabilityState } from '@/lib/onboarding-store';

const AVAILABILITY_OPTIONS: { value: AvailabilityState; label: string; desc: string; color: string }[] = [
  { value: 'available_now',      label: 'Available Now',       desc: 'Ready to start immediately',    color: '#10B981' },
  { value: 'available_in_weeks', label: 'Available in Weeks',  desc: 'Available in 2–4 weeks',        color: '#F59E0B' },
  { value: 'not_available',      label: 'Not Available',       desc: 'Not taking new work right now', color: '#4A5568' },
];

interface Step5Props {
  state: OnboardingState;
  onChange: (patch: Partial<OnboardingState>) => void;
}

export function Step5Pricing({ state, onChange }: Step5Props) {
  const hourly = parseFloat(state.hourlyRate) || 0;
  const monthlyEstimate = hourly * 40 * 4; // 40 hrs/week × 4 weeks

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl font-bold text-text-primary mb-1">Pricing & Availability</h2>
        <p className="text-text-secondary text-sm">Set your rates. You can change these anytime.</p>
      </div>

      {/* Hourly rate */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-3">
          Hourly Rate
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-xl text-text-muted pointer-events-none">
            ₹
          </span>
          <input
            type="number"
            value={state.hourlyRate}
            onChange={(e) => onChange({ hourlyRate: e.target.value })}
            placeholder="0"
            min="0"
            className="w-full bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl pl-10 pr-16 py-4 font-mono text-3xl text-text-primary focus:outline-none focus:border-[rgba(0,212,255,0.3)] focus:shadow-[0_0_0_3px_rgba(0,212,255,0.1)] transition-all"
            aria-label="Hourly rate in rupees"
            data-testid="hourly-rate-input"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-text-muted">/hr</span>
        </div>

        {hourly > 0 && (
          <div className="mt-3 px-4 py-3 bg-[rgba(0,212,255,0.05)] border border-[rgba(0,212,255,0.15)] rounded-xl">
            <p className="text-sm text-text-secondary">
              Estimated monthly earnings at 40 hrs/week:{' '}
              <span className="font-mono font-semibold text-accent-cyan">
                ₹{monthlyEstimate.toLocaleString('en-IN')}
              </span>
            </p>
          </div>
        )}
      </div>

      {/* Project minimum */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Minimum Project Rate
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-text-muted pointer-events-none">₹</span>
          <input
            type="number"
            value={state.projectMinRate}
            onChange={(e) => onChange({ projectMinRate: e.target.value })}
            placeholder="10,000"
            min="0"
            className="w-full bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl pl-10 pr-4 py-3 font-mono text-lg text-text-primary focus:outline-none focus:border-[rgba(0,212,255,0.3)] transition-all"
            aria-label="Minimum project rate in rupees"
          />
        </div>
        <p className="text-xs text-text-muted mt-1">Minimum you&apos;ll accept for a project engagement</p>
      </div>

      {/* Availability */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-3">
          Current Availability
        </label>
        <div className="space-y-2" role="radiogroup" aria-label="Availability status">
          {AVAILABILITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={state.availability === opt.value ? "true" : "false"}
              onClick={() => onChange({ availability: opt.value })}
              className={cn(
                'w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border text-left transition-all duration-200',
                state.availability === opt.value
                  ? 'border-[rgba(255,255,255,0.15)] bg-[rgba(255,255,255,0.03)]'
                  : 'border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.1)]'
              )}
            >
              <div
                className={cn(
                  'w-3 h-3 rounded-full shrink-0 transition-all',
                  state.availability === opt.value && opt.value === 'available_now' && 'animate-pulse'
                )}
                style={{ background: opt.color }}
                aria-hidden="true"
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-text-primary">{opt.label}</p>
                <p className="text-xs text-text-muted">{opt.desc}</p>
              </div>
              {state.availability === opt.value && (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="#00D4FF" aria-hidden="true">
                  <path fillRule="evenodd" d="M8 15A7 7 0 108 1a7 7 0 000 14zm3.707-9.293a1 1 0 00-1.414-1.414L7 7.586 5.707 6.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
              )}
            </button>
          ))}
        </div>

        {state.availability === 'available_in_weeks' && (
          <div className="mt-3">
            <input
              type="number"
              value={state.availableInWeeks}
              onChange={(e) => onChange({ availableInWeeks: e.target.value })}
              placeholder="Number of weeks"
              min="1"
              max="12"
              className="w-full bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-[rgba(0,212,255,0.3)] transition-all"
              aria-label="Available in how many weeks"
            />
          </div>
        )}
      </div>
    </div>
  );
}
