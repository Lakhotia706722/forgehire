import * as React from 'react';
import { cn } from '@/lib/utils';

interface ProgressProps {
  value: number; // 0–100
  max?: number;
  label?: string;
  color?: 'cyan' | 'violet' | 'amber' | 'green' | 'red';
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  className?: string;
}

const colorClasses = {
  cyan:   'bg-accent-cyan',
  violet: 'bg-accent-violet',
  amber:  'bg-accent-amber',
  green:  'bg-accent-green',
  red:    'bg-accent-red',
};

const sizeClasses = {
  sm: 'h-1',
  md: 'h-1.5',
  lg: 'h-2.5',
};

export function Progress({
  value,
  max = 100,
  label,
  color = 'cyan',
  size = 'md',
  showValue = false,
  className,
}: ProgressProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={cn('w-full', className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && <span className="text-xs text-text-secondary">{label}</span>}
          {showValue && (
            <span className="text-xs font-mono text-text-muted">{Math.round(pct)}%</span>
          )}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
        className={cn(
          'w-full bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden',
          sizeClasses[size]
        )}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-700 ease-out',
            colorClasses[color]
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
