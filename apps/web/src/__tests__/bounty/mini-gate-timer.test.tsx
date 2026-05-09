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
import { render, screen, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MiniGateModal } from '@/app/engineer/bounties/[id]/_components/mini-gate-modal';

describe('MiniGateModal — timer behavior', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders intro screen initially', () => {
    render(
      <MiniGateModal open={true} onClose={jest.fn()} onPass={jest.fn()} requiredScore={650} />
    );
    expect(screen.getByTestId('mini-gate-start-btn')).toBeInTheDocument();
    expect(screen.getByText(/Score 650\+ required/)).toBeInTheDocument();
  });

  it('starts timer when test begins', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(
      <MiniGateModal open={true} onClose={jest.fn()} onPass={jest.fn()} requiredScore={650} />
    );

    await user.click(screen.getByTestId('mini-gate-start-btn'));

    // Timer should show 15:00 initially
    expect(screen.getByTestId('mini-gate-timer')).toHaveTextContent('15:00');
  });

  it('timer counts down by 1 second per interval', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(
      <MiniGateModal open={true} onClose={jest.fn()} onPass={jest.fn()} requiredScore={650} />
    );

    await user.click(screen.getByTestId('mini-gate-start-btn'));

    // Advance 5 seconds
    act(() => { jest.advanceTimersByTime(5000); });

    expect(screen.getByTestId('mini-gate-timer')).toHaveTextContent('14:55');
  });

  it('timer does NOT pause when tab becomes hidden (visibilitychange)', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(
      <MiniGateModal open={true} onClose={jest.fn()} onPass={jest.fn()} requiredScore={650} />
    );

    await user.click(screen.getByTestId('mini-gate-start-btn'));

    // Advance 10 seconds
    act(() => { jest.advanceTimersByTime(10000); });
    expect(screen.getByTestId('mini-gate-timer')).toHaveTextContent('14:50');

    // Simulate tab becoming hidden
    Object.defineProperty(document, 'hidden', { value: true, writable: true, configurable: true });
    fireEvent(document, new Event('visibilitychange'));

    // Advance another 10 seconds while "hidden"
    act(() => { jest.advanceTimersByTime(10000); });

    // Timer should have continued — now at 14:40, not paused at 14:50
    expect(screen.getByTestId('mini-gate-timer')).toHaveTextContent('14:40');

    // Restore
    Object.defineProperty(document, 'hidden', { value: false, writable: true, configurable: true });
  });

  it('timer turns red when under 2 minutes', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(
      <MiniGateModal open={true} onClose={jest.fn()} onPass={jest.fn()} requiredScore={650} />
    );

    await user.click(screen.getByTestId('mini-gate-start-btn'));

    // Advance to under 2 minutes (13 minutes elapsed)
    act(() => { jest.advanceTimersByTime(13 * 60 * 1000); });

    const timer = screen.getByTestId('mini-gate-timer');
    expect(timer.className).toContain('accent-red');
  });

  it('timer is NOT red when over 2 minutes remain', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(
      <MiniGateModal open={true} onClose={jest.fn()} onPass={jest.fn()} requiredScore={650} />
    );

    await user.click(screen.getByTestId('mini-gate-start-btn'));

    // Only 30 seconds elapsed — 14:30 remaining
    act(() => { jest.advanceTimersByTime(30000); });

    const timer = screen.getByTestId('mini-gate-timer');
    expect(timer.className).not.toContain('accent-red');
  });

  it('auto-submits when timer reaches zero', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(
      <MiniGateModal open={true} onClose={jest.fn()} onPass={jest.fn()} requiredScore={650} />
    );

    await user.click(screen.getByTestId('mini-gate-start-btn'));

    // Advance full 15 minutes
    act(() => { jest.advanceTimersByTime(15 * 60 * 1000 + 1000); });

    // Should show result screen (pass or fail)
    expect(screen.queryByTestId('mini-gate-timer')).not.toBeInTheDocument();
  });

  it('shows 10 questions', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(
      <MiniGateModal open={true} onClose={jest.fn()} onPass={jest.fn()} requiredScore={650} />
    );

    await user.click(screen.getByTestId('mini-gate-start-btn'));

    expect(screen.getByText(/Question 1 \/ 10/)).toBeInTheDocument();
  });

  it('submit button appears on last question', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(
      <MiniGateModal open={true} onClose={jest.fn()} onPass={jest.fn()} requiredScore={650} />
    );

    await user.click(screen.getByTestId('mini-gate-start-btn'));

    // Navigate to last question (click Next 9 times)
    for (let i = 0; i < 9; i++) {
      const nextBtn = screen.queryByRole('button', { name: /next/i });
      if (nextBtn) await user.click(nextBtn);
    }

    expect(screen.getByTestId('mini-gate-submit-btn')).toBeInTheDocument();
  });
});
