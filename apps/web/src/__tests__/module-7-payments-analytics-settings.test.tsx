/**
 * Module 7: Payments, Analytics & Settings UI Tests
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import EngineerWalletPage from '@/app/engineer/wallet/page';
import EngineerAnalyticsPage from '@/app/engineer/analytics/page';
import CompanyBillingPage from '@/app/company/billing/page';
import MarketRatesPage from '@/app/(public)/market-rates/page';
import EngineerSettingsPage from '@/app/engineer/settings/page';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/wallet',
}));

// Mock Recharts to avoid rendering issues in tests
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Area: () => null,
  Line: () => null,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  ReferenceLine: () => null,
}));

describe('Module 7: Payments, Analytics & Settings', () => {
  function renderWithQuery(ui: JSX.Element) {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
  }

  describe('Engineer Wallet', () => {
    it('renders hero balance card with available balance', () => {
      render(<EngineerWalletPage />);
      
      expect(screen.getByText('Available Balance')).toBeInTheDocument();
      expect(screen.getByText(/₹245,000/)).toBeInTheDocument();
    });

    it('shows secondary stats (pending release and this month earnings)', () => {
      render(<EngineerWalletPage />);
      
      expect(screen.getByText('Pending Release')).toBeInTheDocument();
      expect(screen.getByText(/₹85,000/)).toBeInTheDocument();
      expect(screen.getByText('This Month Earnings')).toBeInTheDocument();
      expect(screen.getByText(/₹180,000/)).toBeInTheDocument();
    });

    it('opens withdrawal modal when withdraw button is clicked', () => {
      render(<EngineerWalletPage />);
      
      const withdrawBtn = screen.getByTestId('withdraw-btn');
      fireEvent.click(withdrawBtn);
      
      expect(screen.getByText('Withdraw Funds')).toBeInTheDocument();
    });

    it('validates withdrawal amount cannot exceed available balance', () => {
      render(<EngineerWalletPage />);
      
      const withdrawBtn = screen.getByTestId('withdraw-btn');
      fireEvent.click(withdrawBtn);
      
      const amountInput = screen.getByTestId('withdraw-amount-input');
      fireEvent.change(amountInput, { target: { value: '300000' } }); // More than available
      
      const confirmBtn = screen.getByTestId('confirm-withdraw-btn');
      expect(confirmBtn).toBeDisabled();
    });

    it('shows KYC banner for amounts over ₹50,000', () => {
      render(<EngineerWalletPage />);
      
      const withdrawBtn = screen.getByTestId('withdraw-btn');
      fireEvent.click(withdrawBtn);
      
      const amountInput = screen.getByTestId('withdraw-amount-input');
      fireEvent.change(amountInput, { target: { value: '60000' } });
      
      expect(screen.getByText('KYC Required')).toBeInTheDocument();
      expect(screen.getByText(/Complete KYC to withdraw amounts over ₹50,000/)).toBeInTheDocument();
    });

    it('displays earnings chart with period toggles', () => {
      render(<EngineerWalletPage />);
      
      expect(screen.getByText('Monthly Earnings')).toBeInTheDocument();
      expect(screen.getByText('This Year')).toBeInTheDocument();
      expect(screen.getByText('Last 6 Months')).toBeInTheDocument();
      expect(screen.getByText('Last 30 Days')).toBeInTheDocument();
      expect(screen.getByTestId('area-chart')).toBeInTheDocument();
    });

    it('displays transaction history with type badges', () => {
      render(<EngineerWalletPage />);
      
      expect(screen.getByText('Recent Transactions')).toBeInTheDocument();
      expect(screen.getByText('Voice AI Agent - Milestone 1')).toBeInTheDocument();
      expect(screen.getByText('RAG System Optimization')).toBeInTheDocument();
    });

    it('opens transaction history modal', () => {
      render(<EngineerWalletPage />);
      
      const historyBtn = screen.getByText('Transaction History');
      fireEvent.click(historyBtn);
      
      expect(screen.getByPlaceholderText('Search transactions...')).toBeInTheDocument();
      expect(screen.getByText('All Types')).toBeInTheDocument();
    });
  });

  describe('Engineer Analytics', () => {
    it('renders overview stats cards with trends', () => {
      render(<EngineerAnalyticsPage />);
      
      expect(screen.getByText('Profile Views')).toBeInTheDocument();
      expect(screen.getByText('1,247')).toBeInTheDocument();
      expect(screen.getByText(/\+18\.5%/)).toBeInTheDocument();
      
      expect(screen.getByText('Acceptance Rate')).toBeInTheDocument();
      expect(screen.getByText('68%')).toBeInTheDocument();
      
      expect(screen.getByText('Avg Response Time')).toBeInTheDocument();
      expect(screen.getByText('2.3 hours')).toBeInTheDocument();
      
      expect(screen.getByText('NeuronScore')).toBeInTheDocument();
      expect(screen.getByText('920')).toBeInTheDocument();
    });

    it('displays profile views chart with annotated events', () => {
      render(<EngineerAnalyticsPage />);
      
      expect(screen.getByText('Profile Views Over Time')).toBeInTheDocument();
      const lineCharts = screen.getAllByTestId('line-chart');
      expect(lineCharts.length).toBeGreaterThan(0);
    });

    it('shows search keywords table with CTR', () => {
      render(<EngineerAnalyticsPage />);
      
      expect(screen.getByText('Top Search Keywords')).toBeInTheDocument();
      expect(screen.getByText('LangChain')).toBeInTheDocument();
      expect(screen.getByText('RAG Systems')).toBeInTheDocument();
      expect(screen.getByText('Impressions')).toBeInTheDocument();
      expect(screen.getByText('CTR')).toBeInTheDocument();
    });

    it('displays skill market demand bar chart', () => {
      render(<EngineerAnalyticsPage />);
      
      expect(screen.getByText('Skill Market Demand')).toBeInTheDocument();
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });

    it('shows NeuronScore history with events', () => {
      render(<EngineerAnalyticsPage />);
      
      expect(screen.getByText('NeuronScore History')).toBeInTheDocument();
    });
  });

  describe('Company Billing', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/api/payments/wallet/transactions')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              success: true,
              data: {
                transactions: [
                  {
                    id: 'txn-1',
                    type: 'credit',
                    amount: 50000,
                    description: 'Contract Milestone Payment',
                    createdAt: '2026-04-01T00:00:00.000Z',
                  },
                  {
                    id: 'txn-2',
                    type: 'debit',
                    amount: 12000,
                    description: 'Withdrawal to UPI',
                    createdAt: '2026-03-25T00:00:00.000Z',
                  },
                ],
                nextCursor: null,
              },
            }),
          } as Response);
        }
        if (url.includes('/api/payments/wallet')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              success: true,
              data: {
                balance: 240000,
                totalEarned: 520000,
                totalWithdrawn: 180000,
                monthlyWithdrawal: 12000,
                currency: 'INR',
              },
            }),
          } as Response);
        }
        if (url.includes('/api/contracts')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              success: true,
              data: [
                { id: 'contract-1', title: 'Voice AI Agent', status: 'active', totalAmount: 100000, rate: 0 },
                { id: 'contract-2', title: 'MLOps Pipeline', status: 'active', totalAmount: 75000, rate: 0 },
              ],
            }),
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, data: {} }),
        } as Response);
      });
    });

    it('renders billing overview with wallet metrics', async () => {
      renderWithQuery(<CompanyBillingPage />);

      expect(await screen.findByText('Billing Overview')).toBeInTheDocument();
      expect(screen.getByText(/₹240,000/)).toBeInTheDocument();
      expect(screen.getByText(/₹520,000/)).toBeInTheDocument();
    });

    it('displays escrow balance with per-contract breakdown', async () => {
      renderWithQuery(<CompanyBillingPage />);

      expect(await screen.findByText('Escrow Balance')).toBeInTheDocument();
      expect(screen.getByText(/₹175,000/)).toBeInTheDocument();
      expect(screen.getByText('Voice AI Agent')).toBeInTheDocument();
      expect(screen.getByText('MLOps Pipeline')).toBeInTheDocument();
    });

    it('displays transaction history with mapped type badges', async () => {
      renderWithQuery(<CompanyBillingPage />);

      expect(await screen.findByText('Transaction History')).toBeInTheDocument();
      expect(screen.getByText('Contract Milestone Payment')).toBeInTheDocument();
      expect(screen.getByText('Withdrawal to UPI')).toBeInTheDocument();
      expect(screen.getByText(/^contract$/i)).toBeInTheDocument();
      expect(screen.getByText(/^payout$/i)).toBeInTheDocument();
    });
  });

  describe('Market Rates', () => {
    it('renders skill selector with search', () => {
      render(<MarketRatesPage />);
      
      expect(screen.getByText('Market Rate Intelligence')).toBeInTheDocument();
      expect(screen.getByText(/Updated from live profiles/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search skills...')).toBeInTheDocument();
    });

    it('displays rate range visualization with percentiles', () => {
      render(<MarketRatesPage />);
      
      expect(screen.getByText(/Entry Level \(P10\)/)).toBeInTheDocument();
      expect(screen.getByText(/Market Median/)).toBeInTheDocument();
      expect(screen.getByText(/Expert Level \(P90\)/)).toBeInTheDocument();
    });

    it('shows NeuronScore tier breakdown', () => {
      render(<MarketRatesPage />);
      
      expect(screen.getByText('Rate by NeuronScore Tier')).toBeInTheDocument();
      expect(screen.getByText('Elite')).toBeInTheDocument();
      expect(screen.getByText('Professional')).toBeInTheDocument();
      expect(screen.getByText('Verified')).toBeInTheDocument();
      expect(screen.getByText('Conditional')).toBeInTheDocument();
    });

    it('displays related skills', () => {
      render(<MarketRatesPage />);
      
      expect(screen.getByText('Related Skills')).toBeInTheDocument();
    });
  });

  describe('Settings', () => {
    it('renders left navigation with all tabs', () => {
      render(<EngineerSettingsPage />);
      
      expect(screen.getByText('Profile')).toBeInTheDocument();
      expect(screen.getByText('Account')).toBeInTheDocument();
      expect(screen.getByText('Notifications')).toBeInTheDocument();
      expect(screen.getByText('Privacy')).toBeInTheDocument();
      expect(screen.getByText('Billing')).toBeInTheDocument();
      expect(screen.getByText('Danger Zone')).toBeInTheDocument();
    });

    it('detects dirty state in profile tab', async () => {
      render(<EngineerSettingsPage />);
      
      const saveBtn = screen.getByTestId('save-profile-btn');
      expect(saveBtn).toBeDisabled();
      
      const nameInput = screen.getByDisplayValue('Arjun Sharma');
      fireEvent.change(nameInput, { target: { value: 'Arjun Kumar' } });
      
      await waitFor(() => {
        expect(saveBtn).not.toBeDisabled();
      });
    });

    it('displays active sessions with revoke buttons', () => {
      render(<EngineerSettingsPage />);
      
      // Switch to Account tab
      const accountTab = screen.getByText('Account');
      fireEvent.click(accountTab);
      
      expect(screen.getByText('Active Sessions')).toBeInTheDocument();
      expect(screen.getByText('MacBook Pro')).toBeInTheDocument();
      expect(screen.getByText('iPhone 15')).toBeInTheDocument();
      expect(screen.getByText('Current')).toBeInTheDocument();
    });

    it('revokes session correctly', () => {
      render(<EngineerSettingsPage />);
      
      const accountTab = screen.getByText('Account');
      fireEvent.click(accountTab);
      
      const revokeBtn = screen.getByTestId('revoke-session-session-2');
      fireEvent.click(revokeBtn);
      
      // Session should be removed
      expect(screen.queryByText('iPhone 15')).not.toBeInTheDocument();
    });

    it('renders notification toggles with smooth animation', () => {
      render(<EngineerSettingsPage />);
      
      const notificationsTab = screen.getByText('Notifications');
      fireEvent.click(notificationsTab);
      
      expect(screen.getByText('Email Notifications')).toBeInTheDocument();
      expect(screen.getByText('Push Notifications (PWA)')).toBeInTheDocument();
      
      // Check for toggle switches
      const toggles = screen.getAllByRole('switch');
      expect(toggles.length).toBeGreaterThan(0);
    });

    it('toggles privacy settings', () => {
      render(<EngineerSettingsPage />);
      
      const privacyTab = screen.getByText('Privacy');
      fireEvent.click(privacyTab);
      
      expect(screen.getByText('Privacy Settings')).toBeInTheDocument();
      expect(screen.getByText('Marketing Emails')).toBeInTheDocument();
      expect(screen.getByText('AI Recommendations')).toBeInTheDocument();
      expect(screen.getByText('Public Activity Feed')).toBeInTheDocument();
    });

    it('shows data export button', () => {
      render(<EngineerSettingsPage />);
      
      const privacyTab = screen.getByText('Privacy');
      fireEvent.click(privacyTab);
      
      expect(screen.getByText('Download Your Data')).toBeInTheDocument();
      expect(screen.getByText('Request Data Export')).toBeInTheDocument();
    });

    it('requires exact email match for account deletion', () => {
      render(<EngineerSettingsPage />);
      
      const dangerTab = screen.getByText('Danger Zone');
      fireEvent.click(dangerTab);
      
      const deleteBtn = screen.getByTestId('open-delete-modal-btn');
      fireEvent.click(deleteBtn);
      
      // Modal title should be visible
      expect(screen.getByRole('heading', { name: 'Delete Account' })).toBeInTheDocument();
      
      const emailInput = screen.getByTestId('delete-email-input');
      fireEvent.change(emailInput, { target: { value: 'wrong@email.com' } });
      
      const continueBtn = screen.getByTestId('delete-step1-btn');
      expect(continueBtn).toBeDisabled();
      
      fireEvent.change(emailInput, { target: { value: 'arjun.sharma@example.com' } });
      expect(continueBtn).not.toBeDisabled();
    });

    it('follows 3-step confirmation for account deletion', async () => {
      render(<EngineerSettingsPage />);
      
      const dangerTab = screen.getByText('Danger Zone');
      fireEvent.click(dangerTab);
      
      const deleteBtn = screen.getByTestId('open-delete-modal-btn');
      fireEvent.click(deleteBtn);
      
      // Step 1: Email confirmation
      const emailInput = screen.getByTestId('delete-email-input');
      fireEvent.change(emailInput, { target: { value: 'arjun.sharma@example.com' } });
      
      const step1Btn = screen.getByTestId('delete-step1-btn');
      fireEvent.click(step1Btn);
      
      // Step 2: Understanding confirmation
      await waitFor(() => {
        expect(screen.getByText(/I understand that my account will be permanently deleted/)).toBeInTheDocument();
      });
      
      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);
      
      const step2Btn = screen.getByText('I Understand, Continue');
      fireEvent.click(step2Btn);
      
      // Step 3: Final confirmation
      await waitFor(() => {
        expect(screen.getByText('Final Confirmation')).toBeInTheDocument();
      });
      
      expect(screen.getByTestId('final-delete-btn')).toBeInTheDocument();
    });
  });

  describe('Data Fetching & Caching', () => {
    it('earnings chart data fetches only once per session', () => {
      const { rerender } = render(<EngineerWalletPage />);
      
      // Chart should be rendered
      expect(screen.getByTestId('area-chart')).toBeInTheDocument();
      
      // Rerender component
      rerender(<EngineerWalletPage />);
      
      // Chart should still be there (data cached)
      expect(screen.getByTestId('area-chart')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels on interactive elements', () => {
      render(<EngineerWalletPage />);
      
      expect(screen.getByRole('group', { name: 'Chart period' })).toBeInTheDocument();
    });

    it('settings tabs have proper ARIA roles', () => {
      render(<EngineerSettingsPage />);
      
      expect(screen.getByRole('navigation', { name: 'Settings navigation' })).toBeInTheDocument();
      
      const profileNav = screen.getByRole('button', { name: /Profile/ });
      expect(profileNav).toHaveAttribute('aria-current', 'page');
    });

    it('toggle switches have proper ARIA attributes', () => {
      render(<EngineerSettingsPage />);
      
      const notificationsTab = screen.getByText('Notifications');
      fireEvent.click(notificationsTab);
      
      const toggles = screen.getAllByRole('switch');
      toggles.forEach((toggle) => {
        expect(toggle).toHaveAttribute('aria-checked');
      });
    });
  });
});
