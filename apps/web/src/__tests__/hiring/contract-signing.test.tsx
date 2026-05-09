/**
 * Tests:
 * - Contract digital signing flow: company signs → engineer receives notification → engineer signs → contract status updates
 * - 72-hour milestone auto-approve countdown
 * - Milestone mismatch warning
 */
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HireModal } from '@/app/company/browse/_components/hire-modal';
import { formatCountdown72h } from '@/lib/hiring-data';

describe('HireModal — digital signing flow', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  function renderAtSigningStep() {
    render(
      <HireModal
        open={true}
        onClose={jest.fn()}
        engineerName="Arjun Sharma"
        engineerHourlyRate={4500}
      />
    );

    // Step 1: select mode (Full-time = first radio)
    const modeCards = screen.getAllByRole('radio');
    fireEvent.click(modeCards[0]);

    // Click "Continue →" button
    const continueBtn = screen.getByRole('button', { name: /continue/i });
    fireEvent.click(continueBtn);

    // Step 2: scope — click "Review Contract →"
    const reviewBtn = screen.getByRole('button', { name: /review contract/i });
    fireEvent.click(reviewBtn);

    // Step 3: contract — click "Proceed to Signing →"
    const signingBtn = screen.getByRole('button', { name: /proceed to signing/i });
    fireEvent.click(signingBtn);
  }

  it('renders signing step with two panels', () => {
    renderAtSigningStep();
    expect(screen.getByText('Company Signature')).toBeInTheDocument();
    expect(screen.getByText('Engineer Signature')).toBeInTheDocument();
  });

  it('company sign button is disabled when signature is empty', () => {
    renderAtSigningStep();
    expect(screen.getByTestId('company-sign-btn')).toBeDisabled();
  });

  it('company sign button enables when name is typed', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderAtSigningStep();

    await user.type(screen.getByTestId('company-signature-input'), 'Vikram Nair');
    expect(screen.getByTestId('company-sign-btn')).not.toBeDisabled();
  });

  it('company signs → shows signed state', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderAtSigningStep();

    await user.type(screen.getByTestId('company-signature-input'), 'Vikram Nair');
    await user.click(screen.getByTestId('company-sign-btn'));

    // Company panel should show signed
    expect(screen.getAllByText('Signed').length).toBeGreaterThan(0);
  });

  it('engineer signing panel shows waiting state after company signs', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderAtSigningStep();

    await user.type(screen.getByTestId('company-signature-input'), 'Vikram Nair');
    await user.click(screen.getByTestId('company-sign-btn'));

    // Engineer panel should show "Waiting for Arjun Sharma…"
    expect(screen.getByText(/waiting for arjun sharma/i)).toBeInTheDocument();
  });

  it('engineer signs automatically after 2s (simulated WebSocket)', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderAtSigningStep();

    await user.type(screen.getByTestId('company-signature-input'), 'Vikram Nair');
    await user.click(screen.getByTestId('company-sign-btn'));

    // Advance 2s for simulated engineer signing
    await act(async () => { jest.advanceTimersByTime(2100); });

    // Both panels should show signed
    expect(screen.getAllByText('Signed').length).toBe(2);
  });

  it('proceed to escrow button appears after both sign', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderAtSigningStep();

    await user.type(screen.getByTestId('company-signature-input'), 'Vikram Nair');
    await user.click(screen.getByTestId('company-sign-btn'));

    await act(async () => { jest.advanceTimersByTime(2100); });

    expect(screen.getByTestId('proceed-to-escrow-btn')).toBeInTheDocument();
  });

  it('contract becomes active after escrow deposit', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderAtSigningStep();

    await user.type(screen.getByTestId('company-signature-input'), 'Vikram Nair');
    await user.click(screen.getByTestId('company-sign-btn'));
    await act(async () => { jest.advanceTimersByTime(2100); });

    await user.click(screen.getByTestId('proceed-to-escrow-btn'));
    await user.click(screen.getByTestId('deposit-escrow-btn'));

    await act(async () => { jest.advanceTimersByTime(2000); });

    // Success screen
    expect(screen.getByText('Contract Active!')).toBeInTheDocument();
    expect(screen.getByTestId('view-contract-btn')).toBeInTheDocument();
  });
});

describe('72-hour milestone auto-approve countdown', () => {
  it('formats countdown correctly for 60 hours remaining', () => {
    const submittedAt = new Date(Date.now() - 12 * 3600000).toISOString(); // 12h ago
    const result = formatCountdown72h(submittedAt);
    // 72 - 12 = ~60 hours remaining (allow for sub-second test execution drift)
    expect(result).toMatch(/^(60h|59h 5[0-9]m)/);
  });

  it('formats countdown correctly for just submitted', () => {
    const submittedAt = new Date().toISOString();
    const result = formatCountdown72h(submittedAt);
    expect(result).toMatch(/72h/);
  });

  it('returns 0h 0m for expired countdown', () => {
    const submittedAt = new Date(Date.now() - 80 * 3600000).toISOString(); // 80h ago
    const result = formatCountdown72h(submittedAt);
    expect(result).toBe('0h 0m');
  });

  it('renders countdown on submitted milestone', () => {
    const { default: ContractPage } = require('@/app/engineer/contracts/[id]/page');
    render(<ContractPage params={{ id: 'contract-1' }} />);

    // The submitted milestone (m2) should show a countdown
    expect(screen.getByTestId('countdown-m2')).toBeInTheDocument();
  });

  it('renders approve and dispute buttons on submitted milestone', () => {
    const { default: ContractPage } = require('@/app/engineer/contracts/[id]/page');
    render(<ContractPage params={{ id: 'contract-1' }} />);

    expect(screen.getByTestId('approve-btn-m2')).toBeInTheDocument();
    expect(screen.getByTestId('dispute-btn-m2')).toBeInTheDocument();
  });
});

describe('HireModal — milestone mismatch warning', () => {
  it('shows warning when milestone total does not match budget', async () => {
    const user = userEvent.setup();
    render(
      <HireModal
        open={true}
        onClose={jest.fn()}
        engineerName="Arjun Sharma"
        engineerHourlyRate={4500}
      />
    );

    // Select Project mode
    const modeCards = screen.getAllByRole('radio');
    fireEvent.click(modeCards[3]); // Project
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    // Set total budget to 100000
    const budgetInput = screen.getByTestId('total-budget-input');
    await user.clear(budgetInput);
    await user.type(budgetInput, '100000');

    // Milestone amount defaults to empty (0) — mismatch with 100000
    expect(screen.getByTestId('milestone-mismatch-warning')).toBeInTheDocument();
  });

  it('does not show warning when milestone total matches budget', async () => {
    const user = userEvent.setup();
    render(
      <HireModal
        open={true}
        onClose={jest.fn()}
        engineerName="Arjun Sharma"
        engineerHourlyRate={4500}
      />
    );

    const modeCards = screen.getAllByRole('radio');
    fireEvent.click(modeCards[3]); // Project
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    // Set budget to 50000
    const budgetInput = screen.getByTestId('total-budget-input');
    await user.clear(budgetInput);
    await user.type(budgetInput, '50000');

    // Set milestone amount to 50000
    const milestoneAmountInput = screen.getByRole('spinbutton', { name: /milestone amount/i });
    await user.clear(milestoneAmountInput);
    await user.type(milestoneAmountInput, '50000');

    expect(screen.queryByTestId('milestone-mismatch-warning')).not.toBeInTheDocument();
  });
});
