'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

const words = ['Build.', 'Be Verified.', 'Be Found.', 'Be Paid.'];

export function AnimatedTagline() {
  const [visibleCount, setVisibleCount] = React.useState(0);

  React.useEffect(() => {
    if (visibleCount >= words.length) return;
    const t = setTimeout(
      () => setVisibleCount((c) => c + 1),
      visibleCount === 0 ? 600 : 500
    );
    return () => clearTimeout(t);
  }, [visibleCount]);

  return (
    <h2 className="font-display font-bold text-4xl xl:text-5xl leading-tight">
      {words.map((word, i) => (
        <span
          key={word}
          className={cn(
            'block transition-all duration-500',
            i < visibleCount
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-3',
            i === 0 && 'text-text-primary',
            i === 1 && 'text-accent-cyan',
            i === 2 && 'text-accent-violet',
            i === 3 && 'text-accent-amber'
          )}
          style={{ transitionDelay: `${i * 80}ms` }}
        >
          {word}
        </span>
      ))}
    </h2>
  );
}
