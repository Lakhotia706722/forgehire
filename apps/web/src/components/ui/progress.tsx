import * as React from 'react';
import { cn } from '@/lib/utils';

interface ProgressProps {
  value: number;
  max?: number;
  label?: string;
  color?: 'cyan' | 'violet' | 'amber' | 'green' | 'red';
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'nh-progress-sm',
  md: 'nh-progress-md',
  lg: 'nh-progress-lg',
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
      <progress
        className={cn('nh-progress', sizeClasses[size], `nh-progress-${color}`)}
        value={value}
        max={max}
        aria-label={label ?? 'Progress'}
      />
    </div>
  );
}
