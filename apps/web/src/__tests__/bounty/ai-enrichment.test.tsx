/**
 * Test: AI enrichment result displays correctly when API response arrives.
 */
import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Step5ReviewAI } from '@/app/company/post-task/_components/step5-review-ai';
import type { PostTaskState, AIEnrichmentResult } from '@/lib/bounty-data';
import { DEFAULT_POST_TASK_STATE } from '@/app/company/post-task/_components/post-task-store';

const MOCK_AI_RESULT: AIEnrichmentResult = {
  estimatedDays: [14, 21],
  suggestedReward: [90000, 120000],
  postingQuality: 7.8,
  deliverableGaps: ['Add acceptance criteria to deliverables'],
  recommendedType: 'Bounty',
  suggestions: [
    'Add performance benchmarks to expected outcome',
    'Specify the tech stack more precisely',
  ],
};

const makeState = (overrides: Partial<PostTaskState> = {}): PostTaskState => ({
  ...DEFAULT_POST_TASK_STATE,
  type: 'Bounty',
  title: 'Build AI Chatbot',
  rewardAmount: '100000',
  deadline: '2025-12-31',
  ...overrides,
});

describe('Step5ReviewAI — AI enrichment display', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders task summary', () => {
    render(
      <Step5ReviewAI state={makeState()} onChange={jest.fn()} onPublish={jest.fn()} />
    );
    expect(screen.getByText('Build AI Chatbot')).toBeInTheDocument();
  });

  it('shows Analyze with AI button when no result', () => {
    render(
      <Step5ReviewAI state={makeState()} onChange={jest.fn()} onPublish={jest.fn()} />
    );
    expect(screen.getByTestId('analyze-ai-btn')).toBeInTheDocument();
    expect(screen.queryByTestId('ai-result-panel')).not.toBeInTheDocument();
  });

  it('shows loading state while analyzing', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(
      <Step5ReviewAI state={makeState()} onChange={jest.fn()} onPublish={jest.fn()} />
    );

    await user.click(screen.getByTestId('analyze-ai-btn'));

    // Button should show loading state
    expect(screen.getByTestId('analyze-ai-btn')).toBeDisabled();
  });

  it('displays AI result panel after analysis completes', async () => {
    const onChange = jest.fn();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    render(
      <Step5ReviewAI state={makeState()} onChange={onChange} onPublish={jest.fn()} />
    );

    await user.click(screen.getByTestId('analyze-ai-btn'));

    // Advance past the 2000ms simulated API delay
    await act(async () => {
      jest.advanceTimersByTime(2500);
    });

    // onChange should have been called with aiResult
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        aiResult: expect.objectContaining({
          estimatedDays: expect.any(Array),
          postingQuality: expect.any(Number),
        }),
      })
    );
  });

  it('renders AI result panel when aiResult is provided', () => {
    render(
      <Step5ReviewAI
        state={makeState({ aiResult: MOCK_AI_RESULT })}
        onChange={jest.fn()}
        onPublish={jest.fn()}
      />
    );

    expect(screen.getByTestId('ai-result-panel')).toBeInTheDocument();
  });

  it('displays estimated timeline from AI result', () => {
    render(
      <Step5ReviewAI
        state={makeState({ aiResult: MOCK_AI_RESULT })}
        onChange={jest.fn()}
        onPublish={jest.fn()}
      />
    );
    expect(screen.getByText('14–21 days')).toBeInTheDocument();
  });

  it('displays suggested reward range from AI result', () => {
    render(
      <Step5ReviewAI
        state={makeState({ aiResult: MOCK_AI_RESULT })}
        onChange={jest.fn()}
        onPublish={jest.fn()}
      />
    );
    expect(screen.getByText(/₹90,000/)).toBeInTheDocument();
    expect(screen.getByText(/₹1,20,000/)).toBeInTheDocument();
  });

  it('displays posting quality score', () => {
    render(
      <Step5ReviewAI
        state={makeState({ aiResult: MOCK_AI_RESULT })}
        onChange={jest.fn()}
        onPublish={jest.fn()}
      />
    );
    expect(screen.getByText('Quality: 7.8/10')).toBeInTheDocument();
  });

  it('displays deliverable gaps when present', () => {
    render(
      <Step5ReviewAI
        state={makeState({ aiResult: MOCK_AI_RESULT })}
        onChange={jest.fn()}
        onPublish={jest.fn()}
      />
    );
    expect(screen.getByText('Add acceptance criteria to deliverables')).toBeInTheDocument();
  });

  it('displays AI suggestions', () => {
    render(
      <Step5ReviewAI
        state={makeState({ aiResult: MOCK_AI_RESULT })}
        onChange={jest.fn()}
        onPublish={jest.fn()}
      />
    );
    expect(screen.getByText('Add performance benchmarks to expected outcome')).toBeInTheDocument();
    expect(screen.getByText('Specify the tech stack more precisely')).toBeInTheDocument();
  });

  it('does not show deliverable gaps section when gaps array is empty', () => {
    const resultNoGaps = { ...MOCK_AI_RESULT, deliverableGaps: [] };
    render(
      <Step5ReviewAI
        state={makeState({ aiResult: resultNoGaps })}
        onChange={jest.fn()}
        onPublish={jest.fn()}
      />
    );
    expect(screen.queryByText(/Deliverable Gaps/i)).not.toBeInTheDocument();
  });

  it('hides Analyze button when result is shown', () => {
    render(
      <Step5ReviewAI
        state={makeState({ aiResult: MOCK_AI_RESULT })}
        onChange={jest.fn()}
        onPublish={jest.fn()}
      />
    );
    expect(screen.queryByTestId('analyze-ai-btn')).not.toBeInTheDocument();
  });

  it('shows Re-analyze button to clear result', async () => {
    const onChange = jest.fn();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    render(
      <Step5ReviewAI
        state={makeState({ aiResult: MOCK_AI_RESULT })}
        onChange={onChange}
        onPublish={jest.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: /re-analyze/i }));
    expect(onChange).toHaveBeenCalledWith({ aiResult: null });
  });

  it('Publish button is disabled when required fields are missing', () => {
    render(
      <Step5ReviewAI
        state={{ ...DEFAULT_POST_TASK_STATE }} // no title, type, reward, deadline
        onChange={jest.fn()}
        onPublish={jest.fn()}
      />
    );
    expect(screen.getByTestId('publish-btn')).toBeDisabled();
  });

  it('Publish button is enabled when all required fields are filled', () => {
    render(
      <Step5ReviewAI
        state={makeState()}
        onChange={jest.fn()}
        onPublish={jest.fn()}
      />
    );
    expect(screen.getByTestId('publish-btn')).not.toBeDisabled();
  });

  it('calls onPublish when Publish button is clicked', async () => {
    const onPublish = jest.fn();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    render(
      <Step5ReviewAI
        state={makeState()}
        onChange={jest.fn()}
        onPublish={onPublish}
      />
    );

    await user.click(screen.getByTestId('publish-btn'));
    expect(onPublish).toHaveBeenCalledTimes(1);
  });
});
