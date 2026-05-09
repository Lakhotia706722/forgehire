'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: [
    'bg-accent-cyan text-bg-base font-semibold',
    'hover:brightness-110',
    'active:scale-[0.97]',
    'btn-shimmer',
    'shadow-[0_0_20px_rgba(0,212,255,0.2)]',
    'hover:shadow-[0_0_30px_rgba(0,212,255,0.35)]',
  ].join(' '),

  secondary: [
    'bg-transparent text-accent-cyan font-medium',
    'border border-[rgba(0,212,255,0.3)]',
    'hover:border-[rgba(0,212,255,0.6)]',
    'hover:bg-[rgba(0,212,255,0.05)]',
    'active:scale-[0.97]',
  ].join(' '),

  ghost: [
    'bg-transparent text-text-secondary font-medium',
    'hover:text-text-primary',
    'relative after:absolute after:bottom-0 after:left-0 after:h-px after:w-0',
    'after:bg-accent-cyan after:transition-[width] after:duration-300',
    'hover:after:w-full',
    'active:scale-[0.97]',
  ].join(' '),

  danger: [
    'bg-accent-red text-white font-semibold',
    'hover:brightness-110',
    'active:scale-[0.97]',
    'shadow-[0_0_20px_rgba(239,68,68,0.2)]',
  ].join(' '),
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-9 px-4 text-sm rounded-lg',
  md: 'h-11 px-6 text-sm rounded-lg',
  lg: 'h-12 px-8 text-base rounded-lg',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled,
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          // Base
          'inline-flex items-center justify-center gap-2',
          'font-body font-medium',
          'transition-all duration-150',
          'cursor-pointer select-none',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base',
          // Variant
          variantClasses[variant],
          // Size
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {loading ? (
          <>
            <Spinner />
            <span>{children}</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4 shrink-0"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
