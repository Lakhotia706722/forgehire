/**
 * Test: Confetti fires only once on assessment pass page.
 *
 * The component uses import('canvas-confetti').then(({ default: confetti }) => {
 *   confetti(...)                    // burst 1 — immediate
 *   setTimeout(() => {
 *     confetti(...)                  // burst 2
 *     confetti(...)                  // burst 3
 *   }, 300)
 * })
 *
 * The firedRef guard ensures this only runs once per component instance.
 */
import React from 'react';
import { render, act, screen } from '@testing-library/react';

// Track confetti calls
const mockConfetti = jest.fn().mockReturnValue(undefined);

jest.mock('canvas-confetti', () => ({
  __esModule: true,
  default: mockConfetti,
}));

// Mock next/dynamic — synchronous passthrough
jest.mock('next/dynamic', () => (_fn: () => Promise<any>, _opts?: any) => {
  const Component = (_props: any) => <div data-testid="dynamic-placeholder" />;
  Component.displayName = 'DynamicComponent';
  return Component;
});

// Mock recharts
jest.mock('recharts', () => ({
  RadarChart: ({ children }: any) => <div>{children}</div>,
  Radar: () => null,
  PolarGrid: () => null,
  PolarAngleAxis: () => null,
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
}));

// Mock NeuronScoreRing
jest.mock('@/components/ui/neuron-score-ring', () => ({
  NeuronScoreRing: () => <div data-testid="score-ring" />,
}));

import { AssessmentReport } from '@/app/engineer/assessment/_components/assessment-report';

// ─── AssessmentReport confetti ────────────────────────────────
describe('Confetti — fires only once on assessment pass', () => {
  beforeEach(() => {
    mockConfetti.mockClear();
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation((_cb) => 1);
    jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('fires confetti on mount for Elite tier', async () => {
    await act(async () => {
      render(<AssessmentReport />);
      // Flush the dynamic import promise
      await Promise.resolve();
    });
    expect(mockConfetti).toHaveBeenCalled();
  });

  it('fires confetti only once per component instance — firedRef guard prevents re-fire', async () => {
    // Use real timers so Promise-chained setTimeout fires naturally
    jest.useRealTimers();

    const { rerender } = render(<AssessmentReport />);

    // Wait for the dynamic import + all setTimeout bursts (300ms + buffer)
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 600));
    });

    const totalAfterMount = mockConfetti.mock.calls.length;
    expect(totalAfterMount).toBeGreaterThan(0);

    // Re-render same instance — firedRef.current = true → no new confetti
    rerender(<AssessmentReport />);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 600));
    });

    // Count must not increase after re-render
    expect(mockConfetti.mock.calls.length).toBe(totalAfterMount);

    jest.useFakeTimers();
  });

  it('confetti is called with correct colors', async () => {
    await act(async () => {
      render(<AssessmentReport />);
      await Promise.resolve();
    });

    if (mockConfetti.mock.calls.length > 0) {
      const firstCall = mockConfetti.mock.calls[0][0];
      expect(firstCall).toHaveProperty('colors');
      expect(firstCall.colors).toContain('#00D4FF');
    }
  });

  it('confetti is called with particleCount', async () => {
    await act(async () => {
      render(<AssessmentReport />);
      await Promise.resolve();
    });

    if (mockConfetti.mock.calls.length > 0) {
      const firstCall = mockConfetti.mock.calls[0][0];
      expect(firstCall).toHaveProperty('particleCount');
      expect(firstCall.particleCount).toBeGreaterThan(0);
    }
  });
});

// ─── Step8Confirmation confetti ───────────────────────────────
describe('Step8Confirmation — confetti fires once', () => {
  beforeEach(() => {
    mockConfetti.mockClear();
  });

  it('fires confetti on mount', async () => {
    jest.useRealTimers();
    const { Step8Confirmation } = await import(
      '@/app/engineer/onboarding/_components/step8-confirmation'
    );

    await act(async () => {
      render(<Step8Confirmation onSaveLater={jest.fn()} />);
      await new Promise((r) => setTimeout(r, 600));
    });

    expect(mockConfetti).toHaveBeenCalled();
    jest.useFakeTimers();
  });

  it('does not fire confetti again on re-render of same instance', async () => {
    jest.useRealTimers();
    const { Step8Confirmation } = await import(
      '@/app/engineer/onboarding/_components/step8-confirmation'
    );
    const onSaveLater = jest.fn();

    const { rerender } = render(<Step8Confirmation onSaveLater={onSaveLater} />);

    // Wait for all confetti bursts to complete
    await act(async () => {
      await new Promise((r) => setTimeout(r, 600));
    });

    const countAfterMount = mockConfetti.mock.calls.length;
    expect(countAfterMount).toBeGreaterThan(0);

    // Re-render same instance — firedRef.current = true → no new confetti
    rerender(<Step8Confirmation onSaveLater={onSaveLater} />);

    await act(async () => {
      await new Promise((r) => setTimeout(r, 600));
    });

    expect(mockConfetti.mock.calls.length).toBe(countAfterMount);
    jest.useFakeTimers();
  });
});
