'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Returns [ref, hasIntersected] — fires once when element enters viewport.
 */
export function useIntersection(threshold = 0.2) {
  const ref = useRef<HTMLElement | null>(null);
  const [intersected, setIntersected] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || intersected) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIntersected(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [intersected, threshold]);

  return [ref, intersected] as const;
}
