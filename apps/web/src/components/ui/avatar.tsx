import * as React from 'react';
import { cn } from '@/lib/utils';

type TierColor = 'elite' | 'professional' | 'verified' | 'conditional' | 'none';

interface AvatarProps {
  src?: string | null;
  initials?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  tier?: TierColor;
  color?: string;
  className?: string;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-[9px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-base',
  xl: 'w-20 h-20 text-xl',
};

const tierRingColors: Record<TierColor, string> = {
  elite:        'ring-2 ring-accent-amber ring-offset-2 ring-offset-bg-base',
  professional: 'ring-2 ring-accent-cyan ring-offset-2 ring-offset-bg-base',
  verified:     'ring-2 ring-accent-violet ring-offset-2 ring-offset-bg-base',
  conditional:  'ring-2 ring-text-muted ring-offset-2 ring-offset-bg-base',
  none:         '',
};

const defaultColors = [
  '#00D4FF', '#7B5EA7', '#F59E0B', '#10B981', '#EF4444',
];

function getColorFromName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return defaultColors[Math.abs(hash) % defaultColors.length];
}

function getInitials(name?: string, initials?: string): string {
  if (initials) return initials.slice(0, 2).toUpperCase();
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({
  src,
  initials,
  name,
  size = 'md',
  tier = 'none',
  color,
  className,
}: AvatarProps) {
  const [imgError, setImgError] = React.useState(false);
  const displayInitials = getInitials(name, initials);
  const bgColor = color ?? (name ? getColorFromName(name) : defaultColors[0]);
  const showImage = src && !imgError;

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center shrink-0 overflow-hidden',
        'font-display font-bold text-bg-base',
        sizeClasses[size],
        tierRingColors[tier],
        className
      )}
      style={!showImage ? { background: bgColor } : undefined}
      aria-label={name ?? displayInitials}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name ?? ''}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <span aria-hidden="true">{displayInitials}</span>
      )}
    </div>
  );
}
