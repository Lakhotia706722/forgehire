'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, rightIcon, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    const [hasValue, setHasValue] = React.useState(
      Boolean(props.value || props.defaultValue)
    );
    const [shaking, setShaking] = React.useState(false);

    // Trigger shake when error appears
    React.useEffect(() => {
      if (error) {
        setShaking(true);
        const t = setTimeout(() => setShaking(false), 400);
        return () => clearTimeout(t);
      }
    }, [error]);

    return (
      <div className="flex flex-col gap-1.5">
        <div
          className={cn(
            'input-wrapper relative',
            hasValue && 'has-value',
            error && 'error',
            shaking && 'animate-shake'
          )}
        >
          {/* Left icon */}
          {leftIcon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none z-10">
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            placeholder={label ? ' ' : props.placeholder}
            className={cn(
              // Base
              'w-full bg-bg-surface text-text-primary',
              'border border-[rgba(255,255,255,0.06)]',
              'rounded-lg px-3 py-3 text-sm',
              'transition-all duration-300',
              'placeholder:text-text-muted',
              // Focus
              'focus:outline-none focus:border-[rgba(0,212,255,0.3)]',
              'focus:shadow-[0_0_0_3px_rgba(0,212,255,0.1)]',
              // Error
              error && 'border-accent-red focus:border-accent-red focus:shadow-[0_0_0_3px_rgba(239,68,68,0.1)]',
              // Icon padding
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              // Float label padding
              label && 'pt-5 pb-2',
              className
            )}
            onChange={(e) => {
              setHasValue(e.target.value.length > 0);
              props.onChange?.(e);
            }}
            {...props}
          />

          {/* Float label */}
          {label && (
            <label
              htmlFor={inputId}
              className={cn(
                'absolute left-3 pointer-events-none',
                'text-sm text-text-muted',
                'transition-all duration-300 ease-out-expo',
                'origin-left',
                leftIcon && 'left-10'
              )}
              style={{ top: '50%', transform: 'translateY(-50%)' }}
            >
              {label}
            </label>
          )}

          {/* Right icon */}
          {rightIcon && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted z-10">
              {rightIcon}
            </span>
          )}
        </div>

        {/* Error message */}
        {error && (
          <p className="text-xs text-accent-red flex items-center gap-1">
            <svg className="w-3 h-3 shrink-0" viewBox="0 0 12 12" fill="currentColor">
              <path d="M6 1a5 5 0 100 10A5 5 0 006 1zm-.5 2.5h1v3h-1v-3zm0 4h1v1h-1v-1z" />
            </svg>
            {error}
          </p>
        )}

        {/* Hint */}
        {hint && !error && (
          <p className="text-xs text-text-muted">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
