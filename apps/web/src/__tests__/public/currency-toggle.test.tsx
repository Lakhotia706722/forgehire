import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProfileHero } from '@/app/(public)/engineer/[id]/_components/profile-hero';
import { MOCK_ENGINEER } from '@/lib/mock-data';

// ProfileHero uses NeuronScoreRing which uses requestAnimationFrame
beforeEach(() => {
  jest.spyOn(window, 'requestAnimationFrame').mockImplementation((_cb) => {
    // Do NOT call cb — prevents infinite recursion in animation loop
    return 1;
  });
  jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('Currency toggle on engineer profile', () => {
  it('shows INR rate by default', () => {
    render(<ProfileHero engineer={MOCK_ENGINEER} />);
    const rateEl = screen.getByTestId('hourly-rate');
    expect(rateEl.textContent).toContain('₹');
    expect(rateEl.textContent).toContain('4,500');
  });

  it('switches to USD when toggle is clicked', async () => {
    const user = userEvent.setup();
    render(<ProfileHero engineer={MOCK_ENGINEER} />);

    const toggle = screen.getByTestId('currency-toggle');
    expect(toggle.textContent).toContain('USD');

    await user.click(toggle);

    // Wait for the 150ms animation delay
    await waitFor(() => {
      const rateEl = screen.getByTestId('hourly-rate');
      expect(rateEl.textContent).toContain('$');
      expect(rateEl.textContent).toContain('54');
    }, { timeout: 500 });
  });

  it('switches back to INR on second click', async () => {
    const user = userEvent.setup();
    render(<ProfileHero engineer={MOCK_ENGINEER} />);

    const toggle = screen.getByTestId('currency-toggle');
    await user.click(toggle);

    await waitFor(() => {
      expect(screen.getByTestId('hourly-rate').textContent).toContain('$');
    }, { timeout: 500 });

    await user.click(toggle);

    await waitFor(() => {
      expect(screen.getByTestId('hourly-rate').textContent).toContain('₹');
    }, { timeout: 500 });
  });

  it('toggle button label updates to reflect current currency', async () => {
    const user = userEvent.setup();
    render(<ProfileHero engineer={MOCK_ENGINEER} />);

    const toggle = screen.getByTestId('currency-toggle');
    expect(toggle.textContent).toContain('USD');

    await user.click(toggle);

    await waitFor(() => {
      expect(screen.getByTestId('currency-toggle').textContent).toContain('INR');
    }, { timeout: 500 });
  });
});
