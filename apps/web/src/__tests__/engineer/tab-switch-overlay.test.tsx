/**
 * Test: Tab-switch overlay appears and logs correctly.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TabSwitchWarning, InactivityWarning, CopyPasteToast } from '@/app/engineer/assessment/_components/anti-cheat-overlays';

describe('TabSwitchWarning', () => {
  it('renders with correct warning count', () => {
    render(<TabSwitchWarning count={1} onReturn={jest.fn()} />);
    expect(screen.getByText(/warning 1 of 3/i)).toBeInTheDocument();
  });

  it('renders warning count 2', () => {
    render(<TabSwitchWarning count={2} onReturn={jest.fn()} />);
    expect(screen.getByText(/warning 2 of 3/i)).toBeInTheDocument();
  });

  it('renders "Return to Test" button', () => {
    render(<TabSwitchWarning count={1} onReturn={jest.fn()} />);
    expect(screen.getByTestId('return-to-test-btn')).toBeInTheDocument();
  });

  it('calls onReturn when "Return to Test" is clicked', async () => {
    const onReturn = jest.fn();
    const user = userEvent.setup();
    render(<TabSwitchWarning count={1} onReturn={onReturn} />);
    await user.click(screen.getByTestId('return-to-test-btn'));
    expect(onReturn).toHaveBeenCalledTimes(1);
  });

  it('has role=alertdialog for accessibility', () => {
    render(<TabSwitchWarning count={1} onReturn={jest.fn()} />);
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });

  it('has aria-modal=true', () => {
    render(<TabSwitchWarning count={1} onReturn={jest.fn()} />);
    expect(screen.getByRole('alertdialog')).toHaveAttribute('aria-modal', 'true');
  });

  it('mentions third violation auto-submits', () => {
    render(<TabSwitchWarning count={2} onReturn={jest.fn()} />);
    expect(screen.getByText(/third violation/i)).toBeInTheDocument();
  });
});

describe('InactivityWarning', () => {
  it('renders countdown in correct format', () => {
    render(<InactivityWarning secondsLeft={120} onDismiss={jest.fn()} />);
    expect(screen.getByText(/2:00/)).toBeInTheDocument();
  });

  it('renders "I\'m here" dismiss button', () => {
    render(<InactivityWarning secondsLeft={90} onDismiss={jest.fn()} />);
    expect(screen.getByRole('button', { name: /i'm here/i })).toBeInTheDocument();
  });

  it('calls onDismiss when dismiss button clicked', async () => {
    const onDismiss = jest.fn();
    const user = userEvent.setup();
    render(<InactivityWarning secondsLeft={90} onDismiss={onDismiss} />);
    await user.click(screen.getByRole('button', { name: /i'm here/i }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('has role=alert for screen readers', () => {
    render(<InactivityWarning secondsLeft={90} onDismiss={jest.fn()} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});

describe('CopyPasteToast', () => {
  it('renders copy-paste disabled message', () => {
    render(<CopyPasteToast />);
    expect(screen.getByText(/copy-paste is disabled/i)).toBeInTheDocument();
  });

  it('has role=status for screen readers', () => {
    render(<CopyPasteToast />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
