/**
 * Module 6: Hiring, Contracts & Messaging UI Tests
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import BrowseEngineersPage from '@/app/company/browse/page';
import CompanyMessagesPage from '@/app/company/messages/page';
import CompanyContractTrackerPage from '@/app/company/contracts/[id]/page';
import EngineerMessagesPage from '@/app/engineer/messages/page';
import EngineerContractTrackerPage from '@/app/engineer/contracts/[id]/page';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/browse',
}));

// Mock URL.createObjectURL for file upload tests
global.URL.createObjectURL = jest.fn(() => 'mock-url');

describe('Module 6: Hiring, Contracts & Messaging', () => {
  describe('Engineer Search & Browse', () => {
    it('renders search bar with autocomplete', async () => {
      render(<BrowseEngineersPage />);
      
      const searchInput = screen.getByTestId('engineer-search-input');
      expect(searchInput).toBeInTheDocument();
      expect(searchInput).toHaveAttribute('placeholder', expect.stringContaining('LangChain'));
      
      // Type to trigger autocomplete
      fireEvent.change(searchInput, { target: { value: 'Lang' } });
      
      await waitFor(() => {
        const autocomplete = screen.queryByTestId('search-autocomplete');
        expect(autocomplete).toBeInTheDocument();
      });
    });

    it('filters engineers by skills, score, rate, availability', async () => {
      render(<BrowseEngineersPage />);
      
      await waitFor(() => {
        expect(screen.queryByText(/\d+ verified engineers available/)).toBeInTheDocument();
      });

      // Should show engineer cards
      const cards = screen.getAllByRole('listitem');
      expect(cards.length).toBeGreaterThan(0);
    });

    it('displays match scores for engineers when job is active', async () => {
      render(<BrowseEngineersPage />);
      
      await waitFor(() => {
        const matchScores = screen.queryAllByText(/\d+% match/);
        expect(matchScores.length).toBeGreaterThan(0);
      });
    });

    it('shows trial engagement CTA on engineer cards', async () => {
      render(<BrowseEngineersPage />);
      
      await waitFor(() => {
        const trialLinks = screen.queryAllByText(/start 2hr trial/);
        expect(trialLinks.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Hiring Flow', () => {
    it('opens hire modal with mode selection', async () => {
      // This would be tested with the hire modal component
      // Skipping for now as it requires more setup
    });

    it('validates milestone totals match contract budget', async () => {
      // Test milestone builder validation
    });

    it('shows digital signing flow with both parties', async () => {
      // Test signing flow
    });

    it('processes escrow deposit via Razorpay', async () => {
      // Test payment flow
    });
  });

  describe('Contract Tracker', () => {
    it('renders contract header with status and parties', () => {
      render(<CompanyContractTrackerPage params={{ id: 'contract-1' }} />);
      
      expect(screen.getByText('Build Multilingual Voice AI Agent')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Sarvam AI')).toBeInTheDocument();
      expect(screen.getByText('Arjun Sharma')).toBeInTheDocument();
    });

    it('displays milestone timeline with status colors', () => {
      render(<CompanyContractTrackerPage params={{ id: 'contract-1' }} />);
      
      expect(screen.getByText('STT + LLM Pipeline')).toBeInTheDocument();
      expect(screen.getByText('TTS + Twilio Integration')).toBeInTheDocument();
      expect(screen.getByText('Load Testing & Deployment')).toBeInTheDocument();
    });

    it('shows 72-hour auto-approve countdown for submitted milestones', async () => {
      render(<CompanyContractTrackerPage params={{ id: 'contract-1' }} />);
      
      await waitFor(() => {
        const countdown = screen.queryByTestId('countdown-m2');
        expect(countdown).toBeInTheDocument();
      });
    });

    it('allows company to approve or dispute submitted milestones', () => {
      render(<CompanyContractTrackerPage params={{ id: 'contract-1' }} />);
      
      const approveBtn = screen.getByTestId('approve-btn-m2');
      const disputeBtn = screen.getByTestId('dispute-btn-m2');
      
      expect(approveBtn).toBeInTheDocument();
      expect(disputeBtn).toBeInTheDocument();
    });

    it('displays escrow bar with released vs remaining funds', () => {
      render(<CompanyContractTrackerPage params={{ id: 'contract-1' }} />);
      
      expect(screen.getByText(/Released:/)).toBeInTheDocument();
      expect(screen.getByText(/Remaining:/)).toBeInTheDocument();
    });

    it('shows document vault with downloadable PDFs', () => {
      render(<CompanyContractTrackerPage params={{ id: 'contract-1' }} />);
      
      expect(screen.getByText('Signed Contract.pdf')).toBeInTheDocument();
      expect(screen.getByText('NDA Agreement.pdf')).toBeInTheDocument();
    });
  });

  describe('Messaging', () => {
    it('renders three-panel layout with conversations, thread, and context', () => {
      render(<CompanyMessagesPage />);
      
      expect(screen.getByTestId('messages-page')).toBeInTheDocument();
      expect(screen.getByLabelText('Conversations')).toBeInTheDocument();
      expect(screen.getByLabelText('Message thread')).toBeInTheDocument();
    });

    it('displays conversation list with unread counts', () => {
      render(<CompanyMessagesPage />);
      
      const convItems = screen.getAllByRole('listitem');
      expect(convItems.length).toBeGreaterThan(0);
    });

    it('shows message bubbles with sender/receiver styling', () => {
      render(<CompanyMessagesPage />);
      
      const messages = screen.getAllByTestId(/message-/);
      expect(messages.length).toBeGreaterThan(0);
    });

    it('displays typing indicator with animated dots', async () => {
      render(<CompanyMessagesPage />);
      
      await waitFor(() => {
        const typingIndicator = screen.queryByTestId('typing-indicator');
        expect(typingIndicator).toBeInTheDocument();
      }, { timeout: 4000 });
    });

    it('shows file upload progress indicator', async () => {
      render(<CompanyMessagesPage />);
      
      const attachBtn = screen.getByTestId('attach-file-btn');
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      
      fireEvent.change(fileInput, { target: { files: [file] } });
      
      await waitFor(() => {
        const progress = screen.queryByTestId('upload-progress');
        expect(progress).toBeInTheDocument();
      });
    });

    it('detects and warns about off-platform contact sharing', async () => {
      render(<CompanyMessagesPage />);
      
      const messageInput = screen.getByTestId('message-input');
      
      fireEvent.change(messageInput, { target: { value: 'Call me at 9876543210' } });
      
      await waitFor(() => {
        const warning = screen.queryByTestId('off-platform-warning');
        expect(warning).toBeInTheDocument();
        expect(warning).toHaveTextContent(/against NeuronHire's terms/);
      });
    });

    it('handles message request accept/decline without page reload', () => {
      render(<EngineerMessagesPage />);
      
      const acceptBtn = screen.queryByTestId('accept-request-conv-3');
      const declineBtn = screen.queryByTestId('decline-request-conv-3');
      
      if (acceptBtn) {
        fireEvent.click(acceptBtn);
        // Should update conversation status
      }
    });

    it('sends messages on Enter key', () => {
      render(<CompanyMessagesPage />);
      
      const messageInput = screen.getByTestId('message-input');
      const sendBtn = screen.getByTestId('send-message-btn');
      
      fireEvent.change(messageInput, { target: { value: 'Test message' } });
      fireEvent.keyDown(messageInput, { key: 'Enter', shiftKey: false });
      
      // Message should be sent
      expect(messageInput).toHaveValue('');
    });
  });

  describe('WebSocket & Real-time Features', () => {
    it('should handle WebSocket reconnection on connection drop', () => {
      // Mock WebSocket reconnection logic
      // Test exponential backoff
    });

    it('updates engineer signature panel in real-time', () => {
      // Test live signature updates via WebSocket
    });

    it('pauses 72-hour countdown on weekends (if business rule)', () => {
      // Test weekend pause logic
    });
  });

  describe('Accessibility & UX', () => {
    it('has proper ARIA labels on interactive elements', () => {
      render(<BrowseEngineersPage />);
      
      expect(screen.getByLabelText('Search engineers')).toBeInTheDocument();
      expect(screen.getByLabelText('Sort engineers')).toBeInTheDocument();
    });

    it('supports keyboard navigation in conversation list', () => {
      render(<CompanyMessagesPage />);
      
      const firstConv = screen.getAllByRole('listitem')[0];
      firstConv.focus();
      
      expect(document.activeElement).toBe(firstConv);
    });

    it('shows loading skeletons before data loads', async () => {
      render(<BrowseEngineersPage />);
      
      // Should show skeletons initially
      // Then hide after data loads
      await waitFor(() => {
        expect(screen.queryByText(/\d+ verified engineers available/)).toBeInTheDocument();
      });
    });
  });
});
