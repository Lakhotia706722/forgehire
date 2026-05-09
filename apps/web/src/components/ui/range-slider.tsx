'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface RangeSliderProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  step?: number;
  formatLabel?: (v: number) => string;
  className?: string;
}

export function RangeSlider({
  min, max, value, onChange, step = 1,
  formatLabel = (v) => String(v),
  className,
}: RangeSliderProps) {
  const trackRef = React.useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = React.useState<'low' | 'high' | null>(null);

  const pct = (v: number) => ((v - min) / (max - min)) * 100;

  function clamp(v: number) {
    return Math.min(max, Math.max(min, Math.round(v / step) * step));
  }

  function getValueFromX(clientX: number): number {
    const track = trackRef.current;
    if (!track) return min;
    const rect = track.getBoundingClientRect();
    const ratio = (clientX - rect.left) / rect.width;
    return clamp(min + ratio * (max - min));
  }

  function handleMouseDown(handle: 'low' | 'high') {
    return (e: React.MouseEvent) => {
      e.preventDefault();
      setDragging(handle);
    };
  }

  React.useEffect(() => {
    if (!dragging) return;

    function onMove(e: MouseEvent) {
      const v = getValueFromX(e.clientX);
      if (dragging === 'low') {
        onChange([Math.min(v, value[1] - step), value[1]]);
      } else {
        onChange([value[0], Math.max(v, value[0] + step)]);
      }
    }
    function onUp() { setDragging(null); }

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragging, value, step, onChange]);

  const lowPct  = pct(value[0]);
  const highPct = pct(value[1]);

  return (
    <div className={cn('space-y-3', className)}>
      {/* Labels */}
      <div className="flex items-center justify-between text-xs font-mono text-text-muted">
        <span className="text-accent-cyan">{formatLabel(value[0])}</span>
        <span className="text-accent-cyan">{formatLabel(value[1])}</span>
      </div>

      {/* Track */}
      <div
        ref={trackRef}
        className="relative h-1.5 rounded-full bg-[rgba(255,255,255,0.08)] cursor-pointer select-none"
        aria-label="Reward range slider"
      >
        {/* Active range */}
        <div
          className="absolute h-full rounded-full bg-accent-cyan"
          style={{ left: `${lowPct}%`, width: `${highPct - lowPct}%` }}
          aria-hidden="true"
        />

        {/* Low handle */}
        <Handle
          pct={lowPct}
          label={`Minimum: ${formatLabel(value[0])}`}
          onMouseDown={handleMouseDown('low')}
          active={dragging === 'low'}
        />

        {/* High handle */}
        <Handle
          pct={highPct}
          label={`Maximum: ${formatLabel(value[1])}`}
          onMouseDown={handleMouseDown('high')}
          active={dragging === 'high'}
        />
      </div>
    </div>
  );
}

function Handle({
  pct, label, onMouseDown, active,
}: {
  pct: number;
  label: string;
  onMouseDown: (e: React.MouseEvent) => void;
  active: boolean;
}) {
  return (
    <div
      role="slider"
      aria-label={label}
      aria-valuetext={label}
      aria-valuenow={pct}
      tabIndex={0}
      className={cn(
        'absolute top-1/2 -translate-y-1/2 -translate-x-1/2',
        'w-4 h-4 rounded-full bg-accent-cyan border-2 border-bg-base',
        'cursor-grab transition-transform duration-100',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base',
        active ? 'scale-125 cursor-grabbing shadow-[0_0_12px_rgba(0,212,255,0.6)]' : 'hover:scale-110 shadow-[0_0_8px_rgba(0,212,255,0.4)]'
      )}
      style={{ left: `${pct}%` }}
      onMouseDown={onMouseDown}
    />
  );
}
