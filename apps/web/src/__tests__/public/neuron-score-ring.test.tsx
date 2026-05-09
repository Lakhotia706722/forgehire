import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { NeuronScoreRing } from '@/components/ui/neuron-score-ring';

// Mock requestAnimationFrame for deterministic tests
let rafCallbacks: FrameRequestCallback[] = [];
const mockRaf = jest.fn((_cb: FrameRequestCallback) => {
  // Capture but do NOT call — prevents infinite recursion in animation loop
  rafCallbacks.push(_cb);
  return rafCallbacks.length;
});
const mockCancelRaf = jest.fn((id: number) => {
  rafCallbacks = rafCallbacks.filter((_, i) => i !== id - 1);
});

beforeEach(() => {
  rafCallbacks = [];
  jest.spyOn(window, 'requestAnimationFrame').mockImplementation(mockRaf);
  jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(mockCancelRaf);
  jest.spyOn(performance, 'now').mockReturnValue(0);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('NeuronScoreRing', () => {
  it('renders with correct aria-label', () => {
    render(<NeuronScoreRing score={820} animate={false} />);
    expect(screen.getByLabelText('NeuronScore: 820')).toBeInTheDocument();
  });

  it('shows score immediately when animate=false', () => {
    render(<NeuronScoreRing score={750} animate={false} />);
    expect(screen.getByText('750')).toBeInTheDocument();
  });

  it('starts at 0 when animate=true', () => {
    render(<NeuronScoreRing score={820} animate={true} />);
    // Before any RAF fires, score should be 0
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('animates only once on mount — does not re-animate on re-render with same props', () => {
    const { rerender } = render(<NeuronScoreRing score={820} animate={true} />);
    const rafCountAfterMount = mockRaf.mock.calls.length;
    expect(rafCountAfterMount).toBeGreaterThan(0); // RAF was scheduled on mount

    // Re-render with same props — effect deps unchanged, no new RAF
    rerender(<NeuronScoreRing score={820} animate={true} />);
    expect(mockRaf.mock.calls.length).toBe(rafCountAfterMount);
  });

  it('resolves to correct tier color for Elite score', () => {
    const { container } = render(<NeuronScoreRing score={850} animate={false} />);
    // Elite tier color is #F59E0B (amber)
    const progressCircle = container.querySelector('circle:last-of-type');
    expect(progressCircle).toHaveAttribute('stroke', '#F59E0B');
  });

  it('resolves to correct tier color for Professional score', () => {
    const { container } = render(<NeuronScoreRing score={650} animate={false} />);
    // Professional tier color is #00D4FF (cyan)
    const progressCircle = container.querySelector('circle:last-of-type');
    expect(progressCircle).toHaveAttribute('stroke', '#00D4FF');
  });

  it('accepts explicit tier override', () => {
    const { container } = render(<NeuronScoreRing score={300} tier="Elite" animate={false} />);
    const progressCircle = container.querySelector('circle:last-of-type');
    expect(progressCircle).toHaveAttribute('stroke', '#F59E0B');
  });
});
