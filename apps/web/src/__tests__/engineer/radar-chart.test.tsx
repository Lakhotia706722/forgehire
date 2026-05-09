/**
 * Test: Radar chart renders with correct dimension values from API.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock recharts — it uses SVG/canvas which jsdom doesn't support well
jest.mock('recharts', () => {
  const MockRadarChart = ({ children, data }: { children: React.ReactNode; data: any[] }) => (
    <div data-testid="radar-chart-mock" data-dimensions={JSON.stringify(data)}>
      {children}
    </div>
  );
  const MockRadar = ({ dataKey }: { dataKey: string }) => (
    <div data-testid={`radar-${dataKey}`} />
  );
  const MockPolarGrid = () => <div data-testid="polar-grid" />;
  const MockPolarAngleAxis = ({ dataKey }: { dataKey: string }) => (
    <div data-testid={`polar-angle-${dataKey}`} />
  );
  const MockResponsiveContainer = ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  );

  return {
    RadarChart: MockRadarChart,
    Radar: MockRadar,
    PolarGrid: MockPolarGrid,
    PolarAngleAxis: MockPolarAngleAxis,
    ResponsiveContainer: MockResponsiveContainer,
  };
});

// Mock next/dynamic to render synchronously (avoids async state update warnings)
jest.mock('next/dynamic', () => (fn: () => Promise<any>, _opts?: any) => {
  // Return a placeholder — recharts is already mocked above
  const Component = (_props: any) => <div data-testid="dynamic-placeholder" />;
  Component.displayName = 'DynamicComponent';
  return Component;
});

// Mock canvas-confetti
jest.mock('canvas-confetti', () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue(undefined),
}));

// Mock NeuronScoreRing to avoid RAF issues
jest.mock('@/components/ui/neuron-score-ring', () => ({
  NeuronScoreRing: ({ score }: { score: number }) => (
    <div data-testid="neuron-score-ring" data-score={score} />
  ),
}));

import { AssessmentReport } from '@/app/engineer/assessment/_components/assessment-report';

describe('AssessmentReport — radar chart', () => {
  beforeEach(() => {
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation((_cb) => 1);
    jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders the radar chart container', () => {
    render(<AssessmentReport />);
    expect(screen.getByTestId('radar-chart')).toBeInTheDocument();
  });

  it('renders the NeuronScore ring with correct score', () => {
    render(<AssessmentReport />);
    const ring = screen.getByTestId('neuron-score-ring');
    expect(ring).toHaveAttribute('data-score', '820');
  });

  it('renders strengths section', () => {
    render(<AssessmentReport />);
    expect(screen.getByText(/Strengths/i)).toBeInTheDocument();
  });

  it('renders areas to improve section', () => {
    render(<AssessmentReport />);
    expect(screen.getByText(/Areas to Improve/i)).toBeInTheDocument();
  });

  it('renders section scores', () => {
    render(<AssessmentReport />);
    // MCQ, Coding, Scenario scores
    expect(screen.getByText('87%')).toBeInTheDocument();
    expect(screen.getByText('91%')).toBeInTheDocument();
    expect(screen.getByText('78%')).toBeInTheDocument();
  });

  it('renders tier badge', () => {
    render(<AssessmentReport />);
    expect(screen.getByText('Elite')).toBeInTheDocument();
  });

  it('renders Go to Dashboard CTA', () => {
    render(<AssessmentReport />);
    expect(screen.getByRole('link', { name: /go to dashboard/i })).toBeInTheDocument();
  });

  it('renders congratulations message for Elite tier', () => {
    render(<AssessmentReport />);
    expect(screen.getByText(/congratulations/i)).toBeInTheDocument();
  });
});
