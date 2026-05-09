/**
 * Centralized dynamic imports for heavy dependencies.
 * All heavy modules are code-split and loaded only when needed.
 *
 * Usage:
 *   import { LazyMonacoEditor } from '@/lib/dynamic-imports';
 *   // Use LazyMonacoEditor as a regular component — it lazy-loads on first render.
 */

import dynamic from 'next/dynamic';

// ─── Monaco Editor ────────────────────────────────────────────
// Never SSR — requires browser APIs
export const LazyMonacoEditor = dynamic(
  () => import('@monaco-editor/react').then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div
        className="w-full h-full bg-bg-elevated rounded-xl flex items-center justify-center"
        role="status"
        aria-label="Loading code editor"
        aria-busy="true"
      >
        <span className="text-text-muted text-sm">Loading editor…</span>
      </div>
    ),
  }
);

// ─── Recharts ─────────────────────────────────────────────────
// Large bundle — lazy load chart components
export const LazyAreaChart = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.AreaChart })),
  { ssr: false }
);

export const LazyLineChart = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.LineChart })),
  { ssr: false }
);

export const LazyBarChart = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.BarChart })),
  { ssr: false }
);

// ─── Canvas Confetti ──────────────────────────────────────────
// Only needed on assessment pass — lazy load as a function
export const lazyConfetti = () =>
  import('canvas-confetti').then((mod) => mod.default);

// ─── Command Palette ──────────────────────────────────────────
// Lazy load to keep initial bundle small
export const LazyCommandPalette = dynamic(
  () => import('@/components/ui/command-palette').then((mod) => ({ default: mod.CommandPalette })),
  { ssr: false }
);

// ─── Heavy Modals ─────────────────────────────────────────────
// Load modals only when first opened
export const LazyHireModal = dynamic(
  () => import('@/app/company/browse/_components/hire-modal').then((mod) => ({ default: mod.HireModal })),
  { ssr: false }
);

export const LazyTrialModal = dynamic(
  () => import('@/app/company/browse/_components/trial-modal').then((mod) => ({ default: mod.TrialModal })),
  { ssr: false }
);
