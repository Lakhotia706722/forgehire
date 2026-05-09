'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  error?: boolean;
  disabled?: boolean;
}

export function OTPInput({
  length = 6,
  value,
  onChange,
  onComplete,
  error = false,
  disabled = false,
}: OTPInputProps) {
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);
  const [shaking, setShaking] = React.useState(false);

  // Trigger shake on error
  React.useEffect(() => {
    if (error) {
      setShaking(true);
      const t = setTimeout(() => setShaking(false), 400);
      return () => clearTimeout(t);
    }
  }, [error]);

  const digits = value.split('').slice(0, length);
  while (digits.length < length) digits.push('');

  function handleChange(index: number, char: string) {
    // Only accept digits
    const digit = char.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = digit;
    const newValue = newDigits.join('');
    onChange(newValue);

    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newValue.replace(/\s/g, '').length === length) {
      onComplete?.(newValue);
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      if (digits[index]) {
        const newDigits = [...digits];
        newDigits[index] = '';
        onChange(newDigits.join(''));
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        onChange(newDigits.join(''));
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    onChange(pasted.padEnd(length, '').slice(0, length));
    // Focus last filled or last box
    const focusIndex = Math.min(pasted.length, length - 1);
    inputRefs.current[focusIndex]?.focus();
    if (pasted.length === length) {
      onComplete?.(pasted);
    }
  }

  return (
    <div
      className={cn('flex gap-3', shaking && 'animate-shake')}
      role="group"
      aria-label="One-time password input"
    >
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => { inputRefs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={digit}
          disabled={disabled}
          aria-label={`Digit ${i + 1}`}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          className={cn(
            'w-12 h-14 text-center text-xl font-mono font-semibold',
            'bg-bg-surface rounded-xl',
            'border-2 transition-all duration-200',
            'text-text-primary',
            'focus:outline-none',
            // Default border
            !error && 'border-[rgba(255,255,255,0.08)]',
            !error && 'focus:border-accent-cyan focus:shadow-[0_0_0_3px_rgba(0,212,255,0.1)]',
            // Filled state
            digit && !error && 'border-[rgba(0,212,255,0.3)] bg-[rgba(0,212,255,0.04)]',
            // Error state
            error && 'border-accent-red shadow-[0_0_0_3px_rgba(239,68,68,0.1)]',
            // Disabled
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        />
      ))}
    </div>
  );
}
