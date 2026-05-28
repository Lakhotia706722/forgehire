/**
 * Test: Mini-gate timer doesn't pause when tab is hidden.
 *
 * The mini-gate timer uses setInterval which continues running regardless
 * of document.hidden state. We verify:
 * 1. Timer counts down correctly
 * 2. Timer is NOT paused by visibilitychange events
 * 3. Timer format is correct
 */
import React from 'react';
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MiniGateModal } from '@/app/engineer/bounties/[id]/_components/mini-gate-modal';

// Mock apiFetch so tests don't hit the network.
// Note: jest.mock is hoisted, so the factory cannot reference outer variables.
jest.mock('@/lib/api-fetch', () => ({
  apiFetch: jest.fn().mockImplementation((path: string) => {
    if (path.includes('/gate-submit')) {
      return Promise.resolve({ passed: true });
    }
    return Promise.resolve({
      testId: 'mini-gate-test-id',
      questions: Array.from({ length: 10 }, (_, i) => ({
        id: `q${i + 1}`,
        number: i + 1,
        text: `Test question ${i + 1}`,
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
      })),
    });
  }),
}));

const TASK_ID = 'test-task-id';

/** Click Start Test and wait until the timer is rendered (API resolved + phase = 'test'). */
async function startTest(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByTestId('mini-gate-start-btn'));
  // Flush the resolved apiFetch promise through the microtask queue
  await act(async () => {
    await Promise.resolve();
  });
  // Wait for phase transition to render the timer
  await waitFor(() => screen.getByTestId('mini-gate-timer'), { timeout: 2000 });
}

describe('MiniGateModal — timer behavior', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders intro screen initially', () => {
    render(
      <MiniGateModal open={true} onClose={jest.fn()} onPass={jest.fn()} requiredScore={650} taskId={TASK_ID} />
    );
    expect(screen.getByTestId('mini-gate-start-btn')).toBeInTheDocument();
    expect(screen.getByText(/Score 650\+ required/)).toBeInTheDocument();
  });

  it('starts timer when test begins', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(
      <MiniGateModal open={true} onClose={jest.fn()} onPass={jest.fn()} requiredScore={650} taskId={TASK_ID} />
    );

    await startTest(user);

    expect(screen.getByTestId('mini-gate-timer')).toHaveTextContent('15:00');
  });

  it('timer counts down by 1 second per interval', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(
      <MiniGateModal open={true} onClose={jest.fn()} onPass={jest.fn()} requiredScore={650} taskId={TASK_ID} />
    );

    await startTest(user);

    act(() => { jest.advanceTimersByTime(5000); });
    expect(screen.getByTestId('mini-gate-timer')).toHaveTextContent('14:55');
  });

  it('timer does NOT pause when tab becomes hidden (visibilitychange)', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(
      <MiniGateModal open={true} onClose={jest.fn()} onPass={jest.fn()} requiredScore={650} taskId={TASK_ID} />
    );

    await startTest(user);

    act(() => { jest.advanceTimersByTime(10000); });
    expect(screen.getByTestId('mini-gate-timer')).toHaveTextContent('14:50');

    Object.defineProperty(document, 'hidden', { value: true, writable: true, configurable: true });
    fireEvent(document, new Event('visibilitychange'));

    act(() => { jest.advanceTimersByTime(10000); });
    expect(screen.getByTestId('mini-gate-timer')).toHaveTextContent('14:40');

    Object.defineProperty(document, 'hidden', { value: false, writable: true, configurable: true });
  });

  it('timer turns red when under 2 minutes', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(
      <MiniGateModal open={true} onClose={jest.fn()} onPass={jest.fn()} requiredScore={650} taskId={TASK_ID} />
    );

    await startTest(user);
    act(() => { jest.advanceTimersByTime(13 * 60 * 1000); });

    expect(screen.getByTestId('mini-gate-timer').className).toContain('accent-red');
  });

  it('timer is NOT red when over 2 minutes remain', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(
      <MiniGateModal open={true} onClose={jest.fn()} onPass={jest.fn()} requiredScore={650} taskId={TASK_ID} />
    );

    await startTest(user);
    act(() => { jest.advanceTimersByTime(30000); });

    expect(screen.getByTestId('mini-gate-timer').className).not.toContain('accent-red');
  });

  it('auto-submits when timer reaches zero', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(
      <MiniGateModal open={true} onClose={jest.fn()} onPass={jest.fn()} requiredScore={650} taskId={TASK_ID} />
    );

    await startTest(user);
    act(() => { jest.advanceTimersByTime(15 * 60 * 1000 + 1000); });
    await waitFor(() => {
      expect(screen.getByText(/Test Passed!/)).toBeInTheDocument();
    });
  });

  it('shows 10 questions', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(
      <MiniGateModal open={true} onClose={jest.fn()} onPass={jest.fn()} requiredScore={650} taskId={TASK_ID} />
    );

    await startTest(user);
    expect(screen.getByText(/Question 1 \/ 10/)).toBeInTheDocument();
  });

  it('submit button appears on last question', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(
      <MiniGateModal open={true} onClose={jest.fn()} onPass={jest.fn()} requiredScore={650} taskId={TASK_ID} />
    );

    await startTest(user);

    for (let i = 0; i < 9; i++) {
      const nextBtn = screen.queryByRole('button', { name: /next/i });
      if (nextBtn) await user.click(nextBtn);
    }

    expect(screen.getByTestId('mini-gate-submit-btn')).toBeInTheDocument();
  });
});
