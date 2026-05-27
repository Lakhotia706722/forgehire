'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { rangeSegmentClasses } from '@/lib/pct-classes';

interface RangeSliderProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  step?: number;
  formatLabel?: (v: number) => string;
  ariaLabel?: string;
  className?: string;
}

export function RangeSlider({
  min,
  max,
  value,
  onChange,
  step = 1,
  formatLabel = (v) => String(v),
  ariaLabel,
  className,
}: RangeSliderProps) {
  const lowPct = ((value[0] - min) / (max - min)) * 100;
  const highPct = ((value[1] - min) / (max - min)) * 100;

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between text-xs font-mono text-text-muted">
        <span className="text-accent-cyan">{formatLabel(value[0])}</span>
        <span className="text-accent-cyan">{formatLabel(value[1])}</span>
      </div>

      <div
        className="relative h-6 flex items-center"
        aria-label={ariaLabel ?? 'Range slider'}
      >
        <div className="absolute inset-x-0 h-1.5 rounded-full bg-[rgba(255,255,255,0.08)]" aria-hidden="true" />
        <div
          className={cn('absolute h-1.5 rounded-full bg-accent-cyan', rangeSegmentClasses(lowPct, highPct))}
          aria-hidden="true"
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value[0]}
          onChange={(e) => {
            const next = Number(e.target.value);
            onChange([Math.min(next, value[1] - step), value[1]]);
          }}
          aria-label={`Minimum: ${formatLabel(value[0])}`}
          className="nh-range-input z-10"
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value[1]}
          onChange={(e) => {
            const next = Number(e.target.value);
            onChange([value[0], Math.max(next, value[0] + step)]);
          }}
          aria-label={`Maximum: ${formatLabel(value[1])}`}
          className="nh-range-input z-20"
        />
      </div>
    </div>
  );
}
