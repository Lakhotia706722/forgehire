/**
 * Test: Bounty card countdown timer shows correct time remaining.
 */
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { BountyCard } from '@/app/engineer/bounties/_components/bounty-card';
import { getDeadlineLabel, formatCountdown } from '@/lib/bounty-data';
import type { BountyCard as BountyCardType } from '@/lib/bounty-data';

const makeBounty = (deadlineOffset: number): BountyCardType => ({
  id: 'test-b1',
  type: 'Bounty',
  title: 'Test Bounty',
  description: 'Test description for the bounty card',
  company: 'Test Co',
  companyInitials: 'TC',
  companyColor: '#00D4FF',
  companyVerified: true,
  skills: ['Python', 'FastAPI'],
  reward: 50000,
  currency: 'INR',
  difficulty: 'Advanced',
  deadline: new Date(Date.now() + deadlineOffset),
  minNeuronScore: 400,
  participantCount: 5,
  ndaRequired: false,
  status: 'open',
});

describe('getDeadlineLabel', () => {
  it('returns urgent=true for deadlines under 48 hours', () => {
    const deadline = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
    const { urgent } = getDeadlineLabel(deadline);
    expect(urgent).toBe(true);
  });

  it('returns urgent=false for deadlines over 48 hours', () => {
    const deadline = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000); // 5 days
    const { urgent } = getDeadlineLabel(deadline);
    expect(urgent).toBe(false);
  });

  it('returns "Expired" for past deadlines', () => {
    const deadline = new Date(Date.now() - 1000);
    const { label, urgent } = getDeadlineLabel(deadline);
    expect(label).toBe('Expired');
    expect(urgent).toBe(true);
  });

  it('shows hours for deadlines under 48h', () => {
    const deadline = new Date(Date.now() + 36 * 60 * 60 * 1000); // 36h
    const { label } = getDeadlineLabel(deadline);
    expect(label).toMatch(/h left/);
  });

  it('shows days for deadlines over 48h', () => {
    const deadline = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000); // 10 days
    const { label } = getDeadlineLabel(deadline);
    expect(label).toMatch(/days left/);
  });
});

describe('formatCountdown', () => {
  it('formats days, hours, minutes, seconds correctly', () => {
    // 2 days + 3 hours + 4 minutes + 5 seconds
    const ms = (2 * 86400 + 3 * 3600 + 4 * 60 + 5) * 1000;
    const deadline = new Date(Date.now() + ms);
    const result = formatCountdown(deadline);
    expect(result).toMatch(/02d/);
    expect(result).toMatch(/03h/);
    expect(result).toMatch(/04m/);
  });

  it('returns all zeros for expired deadline', () => {
    const deadline = new Date(Date.now() - 1000);
    const result = formatCountdown(deadline);
    expect(result).toBe('00d 00h 00m 00s');
  });

  it('pads single digits with leading zeros', () => {
    const ms = (1 * 86400 + 1 * 3600 + 1 * 60 + 1) * 1000;
    const deadline = new Date(Date.now() + ms);
    const result = formatCountdown(deadline);
    expect(result).toMatch(/01d 01h 01m 01s/);
  });
});

describe('BountyCard — deadline display', () => {
  it('renders deadline label', () => {
    const bounty = makeBounty(5 * 24 * 60 * 60 * 1000); // 5 days
    render(<BountyCard bounty={bounty} engineerScore={920} />);
    const deadline = screen.getByTestId(`deadline-${bounty.id}`);
    expect(deadline).toBeInTheDocument();
    expect(deadline.textContent).toMatch(/days left/);
  });

  it('applies red color class for urgent deadlines', () => {
    const bounty = makeBounty(24 * 60 * 60 * 1000); // 24h — urgent
    render(<BountyCard bounty={bounty} engineerScore={920} />);
    const deadline = screen.getByTestId(`deadline-${bounty.id}`);
    expect(deadline.className).toContain('accent-red');
  });

  it('applies muted color for non-urgent deadlines', () => {
    const bounty = makeBounty(10 * 24 * 60 * 60 * 1000); // 10 days
    render(<BountyCard bounty={bounty} engineerScore={920} />);
    const deadline = screen.getByTestId(`deadline-${bounty.id}`);
    expect(deadline.className).toContain('text-muted');
  });

  it('renders reward amount correctly', () => {
    const bounty = makeBounty(5 * 24 * 60 * 60 * 1000);
    render(<BountyCard bounty={bounty} engineerScore={920} />);
    const reward = screen.getByTestId(`reward-${bounty.id}`);
    expect(reward.textContent).toContain('₹');
    expect(reward.textContent).toContain('50,000');
  });

  it('shows locked overlay when engineer score is too low', () => {
    const bounty = makeBounty(5 * 24 * 60 * 60 * 1000);
    bounty.minNeuronScore = 800;
    render(<BountyCard bounty={bounty} engineerScore={400} />);
    expect(screen.getByText(/Score 800\+ required/)).toBeInTheDocument();
    expect(screen.getByText(/Mini-Gate Test/)).toBeInTheDocument();
  });

  it('does not show locked overlay when engineer is eligible', () => {
    const bounty = makeBounty(5 * 24 * 60 * 60 * 1000);
    bounty.minNeuronScore = 400;
    render(<BountyCard bounty={bounty} engineerScore={920} />);
    expect(screen.queryByText(/Score.*required/)).not.toBeInTheDocument();
  });
});
