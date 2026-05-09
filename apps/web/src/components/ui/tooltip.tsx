'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export function Tooltip({ content, children, side = 'top', className }: TooltipProps) {
  const [visible, setVisible] = React.useState(false);
  const [coords, setCoords] = React.useState({ x: 0, y: 0 });
  const triggerRef = React.useRef<HTMLElement>(null);
  const tooltipRef = React.useRef<HTMLDivElement>(null);

  function show() { setVisible(true); }
  function hide() { setVisible(false); }

  const sideClasses = {
    top:    'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left:   'right-full top-1/2 -translate-y-1/2 mr-2',
    right:  'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowClasses = {
    top:    'top-full left-1/2 -translate-x-1/2 border-t-[rgba(255,255,255,0.12)] border-x-transparent border-b-transparent border-4',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-[rgba(255,255,255,0.12)] border-x-transparent border-t-transparent border-4',
    left:   'left-full top-1/2 -translate-y-1/2 border-l-[rgba(255,255,255,0.12)] border-y-transparent border-r-transparent border-4',
    right:  'right-full top-1/2 -translate-y-1/2 border-r-[rgba(255,255,255,0.12)] border-y-transparent border-l-transparent border-4',
  };

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {React.cloneElement(children, { ref: triggerRef } as any)}
      {visible && (
        <div
          ref={tooltipRef}
          role="tooltip"
          className={cn(
            'absolute z-50 pointer-events-none',
            'px-2.5 py-1.5 rounded-lg',
            'bg-bg-elevated border border-[rgba(255,255,255,0.12)]',
            'text-xs text-text-primary font-body whitespace-nowrap',
            'shadow-lg animate-fade-up',
            sideClasses[side],
            className
          )}
        >
          {content}
          <span className={cn('absolute w-0 h-0', arrowClasses[side])} aria-hidden="true" />
        </div>
      )}
    </span>
  );
}
