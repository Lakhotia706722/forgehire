import * as React from 'react';
import { cn } from '@/lib/utils';

export type BadgeVariant = 'cyan' | 'violet' | 'amber' | 'green' | 'red' | 'gray';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  /** Tier badges get a subtle pulse animation */
  tier?: boolean;
}

const variantClasses: Record<BadgeVariant, string> = {
  cyan:   'bg-[rgba(0,212,255,0.1)]   text-accent-cyan   border border-[rgba(0,212,255,0.2)]',
  violet: 'bg-[rgba(123,94,167,0.15)] text-accent-violet border border-[rgba(123,94,167,0.3)]',
  amber:  'bg-[rgba(245,158,11,0.1)]  text-accent-amber  border border-[rgba(245,158,11,0.2)]',
  green:  'bg-[rgba(16,185,129,0.1)]  text-accent-green  border border-[rgba(16,185,129,0.2)]',
  red:    'bg-[rgba(239,68,68,0.1)]   text-accent-red    border border-[rgba(239,68,68,0.2)]',
  gray:   'bg-[rgba(255,255,255,0.05)] text-text-secondary border border-[rgba(255,255,255,0.1)]',
};

export function Badge({
  variant = 'gray',
  tier = false,
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1',
        'px-2.5 py-0.5 rounded-full',
        'text-xs font-mono font-medium',
        'whitespace-nowrap',
        variantClasses[variant],
        tier && 'animate-pulse-ring',
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

/** Convenience tier badge */
export type TierName = 'Elite' | 'Professional' | 'Verified' | 'Conditional';

const tierConfig: Record<TierName, { variant: BadgeVariant; dot: string }> = {
  Elite:        { variant: 'amber',  dot: 'bg-accent-amber' },
  Professional: { variant: 'cyan',   dot: 'bg-accent-cyan' },
  Verified:     { variant: 'violet', dot: 'bg-accent-violet' },
  Conditional:  { variant: 'gray',   dot: 'bg-text-muted' },
};

export function TierBadge({ tier }: { tier: TierName }) {
  const { variant, dot } = tierConfig[tier];
  return (
    <Badge variant={variant} tier>
      <span className={cn('w-1.5 h-1.5 rounded-full', dot)} />
      {tier}
    </Badge>
  );
}
