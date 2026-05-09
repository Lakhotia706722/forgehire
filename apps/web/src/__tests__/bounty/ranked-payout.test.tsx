/**
 * Test: Ranked payout total validation — sum of prizes cannot exceed total reward.
 */
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Step3TimelineReward } from '@/app/company/post-task/_components/step3-timeline-reward';
import type { PostTaskState } from '@/lib/bounty-data';
import { DEFAULT_POST_TASK_STATE } from '@/app/company/post-task/_components/post-task-store';

const makeContestState = (rewardAmount: string, prizes?: PostTaskState['contestPrizes']): PostTaskState => ({
  ...DEFAULT_POST_TASK_STATE,
  type: 'Contest',
  rewardAmount,
  contestPrizes: prizes ?? [
    { id: '1', rank: 1, label: '1st Place', amount: 0, percentage: 50 },
    { id: '2', rank: 2, label: '2nd Place', amount: 0, percentage: 30 },
    { id: '3', rank: 3, label: '3rd Place', amount: 0, percentage: 20 },
  ],
});

describe('Step3TimelineReward — ranked payout validation', () => {
  it('renders prize tiers for Contest type', () => {
    render(
      <Step3TimelineReward
        state={makeContestState('100000')}
        onChange={jest.fn()}
      />
    );
    expect(screen.getByText('Prize Tiers')).toBeInTheDocument();
    expect(screen.getByTestId('prize-pct-1')).toBeInTheDocument();
    expect(screen.getByTestId('prize-pct-2')).toBeInTheDocument();
    expect(screen.getByTestId('prize-pct-3')).toBeInTheDocument();
  });

  it('shows no error when percentages sum to 100', () => {
    render(
      <Step3TimelineReward
        state={makeContestState('100000')}
        onChange={jest.fn()}
      />
    );
    // Default is 50+30+20 = 100 — no error
    expect(screen.queryByTestId('pct-error')).not.toBeInTheDocument();
    expect(screen.getByText('✓ 100%')).toBeInTheDocument();
  });

  it('shows error when percentages do not sum to 100', () => {
    const state = makeContestState('100000', [
      { id: '1', rank: 1, label: '1st Place', amount: 0, percentage: 60 },
      { id: '2', rank: 2, label: '2nd Place', amount: 0, percentage: 30 },
      // Total: 90% — missing 10%
    ]);
    render(<Step3TimelineReward state={state} onChange={jest.fn()} />);
    expect(screen.getByTestId('pct-error')).toBeInTheDocument();
    expect(screen.getByTestId('pct-error').textContent).toContain('90%');
    expect(screen.getByTestId('pct-error').textContent).toContain('must equal 100%');
  });

  it('shows error when percentages exceed 100', () => {
    const state = makeContestState('100000', [
      { id: '1', rank: 1, label: '1st Place', amount: 0, percentage: 70 },
      { id: '2', rank: 2, label: '2nd Place', amount: 0, percentage: 40 },
      // Total: 110%
    ]);
    render(<Step3TimelineReward state={state} onChange={jest.fn()} />);
    expect(screen.getByTestId('pct-error')).toBeInTheDocument();
    expect(screen.getByTestId('pct-error').textContent).toContain('110%');
  });

  it('calculates prize amounts from percentages and total reward', () => {
    render(
      <Step3TimelineReward
        state={makeContestState('200000')}
        onChange={jest.fn()}
      />
    );
    // 50% of 200000 = 100000
    expect(screen.getByText('₹1,00,000')).toBeInTheDocument();
    // 30% of 200000 = 60000
    expect(screen.getByText('₹60,000')).toBeInTheDocument();
    // 20% of 200000 = 40000
    expect(screen.getByText('₹40,000')).toBeInTheDocument();
  });

  it('calls onChange when percentage is updated', async () => {
    const onChange = jest.fn();
    const user = userEvent.setup();
    render(
      <Step3TimelineReward
        state={makeContestState('100000')}
        onChange={onChange}
      />
    );

    const pct1Input = screen.getByTestId('prize-pct-1');
    await user.clear(pct1Input);
    await user.type(pct1Input, '60');

    expect(onChange).toHaveBeenCalled();
  });

  it('can add a new prize tier', async () => {
    const onChange = jest.fn();
    const user = userEvent.setup();
    render(
      <Step3TimelineReward
        state={makeContestState('100000')}
        onChange={onChange}
      />
    );

    await user.click(screen.getByTestId('add-prize-tier-btn'));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        contestPrizes: expect.arrayContaining([
          expect.objectContaining({ rank: 4 }),
        ]),
      })
    );
  });

  it('does not show prize tiers for non-Contest types', () => {
    render(
      <Step3TimelineReward
        state={{ ...DEFAULT_POST_TASK_STATE, type: 'Bounty', rewardAmount: '50000' }}
        onChange={jest.fn()}
      />
    );
    expect(screen.queryByText('Prize Tiers')).not.toBeInTheDocument();
    expect(screen.queryByTestId('prize-pct-1')).not.toBeInTheDocument();
  });

  it('shows payment type selector for non-Contest types', () => {
    render(
      <Step3TimelineReward
        state={{ ...DEFAULT_POST_TASK_STATE, type: 'Bounty', rewardAmount: '50000' }}
        onChange={jest.fn()}
      />
    );
    expect(screen.getByRole('radio', { name: /fixed/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /milestone/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /hourly/i })).toBeInTheDocument();
  });

  it('reward amount input is present', () => {
    render(
      <Step3TimelineReward
        state={makeContestState('100000')}
        onChange={jest.fn()}
      />
    );
    expect(screen.getByTestId('reward-amount-input')).toBeInTheDocument();
    expect(screen.getByTestId('reward-amount-input')).toHaveValue(100000);
  });
});
