import * as React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Rounded pill shape */
  rounded?: boolean;
  /** Circle shape */
  circle?: boolean;
}

export function Skeleton({ rounded, circle, className, style, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'skeleton',
        rounded && 'rounded-full',
        circle && 'rounded-full aspect-square',
        !rounded && !circle && 'rounded-lg',
        className
      )}
      style={style}
      aria-hidden="true"
      {...props}
    />
  );
}

/** Pre-built skeleton for a card */
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'bg-bg-surface rounded-xl border border-[rgba(255,255,255,0.06)] p-6 space-y-4',
        className
      )}
    >
      <div className="flex items-center gap-3">
        <Skeleton circle className="w-10 h-10" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-5/6" />
      <Skeleton className="h-3 w-4/6" />
    </div>
  );
}

/** Pre-built skeleton for a profile header */
export function ProfileSkeleton() {
  return (
    <div className="flex items-start gap-4">
      <Skeleton circle className="w-16 h-16" />
      <div className="flex-1 space-y-3">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-32" />
        <div className="flex gap-2">
          <Skeleton rounded className="h-6 w-20" />
          <Skeleton rounded className="h-6 w-24" />
        </div>
      </div>
    </div>
  );
}
