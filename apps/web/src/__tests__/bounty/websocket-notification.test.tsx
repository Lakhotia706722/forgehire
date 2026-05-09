/**
 * Test: New bounty WebSocket notification appears and links to correct page.
 */
import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NewBountyToast } from '@/app/engineer/bounties/_components/new-bounty-toast';

const MOCK_NOTIFICATION = {
  id: 'b-ws-1',
  title: 'Build RAG Pipeline for E-commerce Search',
  reward: 95000,
  currency: 'INR',
};

describe('NewBountyToast', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders when notification is provided', () => {
    render(<NewBountyToast notification={MOCK_NOTIFICATION} onDismiss={jest.fn()} />);
    expect(screen.getByTestId('new-bounty-toast')).toBeInTheDocument();
  });

  it('does not render when notification is null', () => {
    render(<NewBountyToast notification={null} onDismiss={jest.fn()} />);
    expect(screen.queryByTestId('new-bounty-toast')).not.toBeInTheDocument();
  });

  it('displays the bounty title', () => {
    render(<NewBountyToast notification={MOCK_NOTIFICATION} onDismiss={jest.fn()} />);
    expect(screen.getByText(MOCK_NOTIFICATION.title)).toBeInTheDocument();
  });

  it('displays the reward amount', () => {
    render(<NewBountyToast notification={MOCK_NOTIFICATION} onDismiss={jest.fn()} />);
    expect(screen.getByText(/₹95,000/)).toBeInTheDocument();
  });

  it('View button links to correct bounty page', () => {
    render(<NewBountyToast notification={MOCK_NOTIFICATION} onDismiss={jest.fn()} />);
    const viewLink = screen.getByTestId('new-bounty-view-link');
    expect(viewLink).toHaveAttribute('href', `/engineer/bounties/${MOCK_NOTIFICATION.id}`);
  });

  it('calls onDismiss when dismiss button is clicked', async () => {
    const onDismiss = jest.fn();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<NewBountyToast notification={MOCK_NOTIFICATION} onDismiss={onDismiss} />);
    await user.click(screen.getByRole('button', { name: /dismiss/i }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('calls onDismiss when View button is clicked', async () => {
    const onDismiss = jest.fn();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<NewBountyToast notification={MOCK_NOTIFICATION} onDismiss={onDismiss} />);
    await user.click(screen.getByTestId('new-bounty-view-link'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('auto-dismisses after 8 seconds', () => {
    const onDismiss = jest.fn();
    render(<NewBountyToast notification={MOCK_NOTIFICATION} onDismiss={onDismiss} />);
    act(() => { jest.advanceTimersByTime(8000); });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('does not auto-dismiss before 8 seconds', () => {
    const onDismiss = jest.fn();
    render(<NewBountyToast notification={MOCK_NOTIFICATION} onDismiss={onDismiss} />);
    act(() => { jest.advanceTimersByTime(7999); });
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('has role=alert for screen readers', () => {
    render(<NewBountyToast notification={MOCK_NOTIFICATION} onDismiss={jest.fn()} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
