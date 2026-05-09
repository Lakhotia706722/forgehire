/**
 * Tests:
 * - File upload progress indicator appears and completes correctly
 * - Message request accept/decline updates conversation list without page reload
 * - Off-platform detection banner appears for messages containing phone numbers
 */
import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MessagesPage from '@/app/engineer/messages/page';
import { detectOffPlatform } from '@/lib/hiring-data';

describe('detectOffPlatform', () => {
  it('detects 10-digit phone numbers', () => {
    expect(detectOffPlatform('Call me at 9876543210')).toBe(true);
  });

  it('detects +91 phone numbers', () => {
    expect(detectOffPlatform('My number is +91 9876543210')).toBe(true);
  });

  it('detects email addresses', () => {
    expect(detectOffPlatform('Email me at arjun@example.com')).toBe(true);
  });

  it('detects WhatsApp mentions', () => {
    expect(detectOffPlatform('Let\'s connect on WhatsApp')).toBe(true);
  });

  it('detects Telegram mentions', () => {
    expect(detectOffPlatform('Find me on Telegram')).toBe(true);
  });

  it('returns false for normal messages', () => {
    expect(detectOffPlatform('The RAG pipeline is ready for review')).toBe(false);
    expect(detectOffPlatform('Let\'s discuss the project scope')).toBe(false);
    expect(detectOffPlatform('I\'ll submit the deliverables by Friday')).toBe(false);
  });

  it('returns false for short numbers that are not phone numbers', () => {
    expect(detectOffPlatform('I have 123 documents')).toBe(false);
    expect(detectOffPlatform('The score is 9876')).toBe(false);
  });
});

describe('MessagesPage — off-platform warning', () => {
  it('renders the messages page', () => {
    render(<MessagesPage />);
    expect(screen.getByTestId('messages-page')).toBeInTheDocument();
  });

  it('shows off-platform warning when phone number is typed', async () => {
    const user = userEvent.setup();
    render(<MessagesPage />);

    const input = screen.getByTestId('message-input');
    await user.type(input, 'Call me at 9876543210');

    expect(screen.getByTestId('off-platform-warning')).toBeInTheDocument();
    expect(screen.getByText(/sharing contact info/i)).toBeInTheDocument();
  });

  it('shows off-platform warning for email address', async () => {
    const user = userEvent.setup();
    render(<MessagesPage />);

    const input = screen.getByTestId('message-input');
    await user.type(input, 'Email me at test@example.com');

    expect(screen.getByTestId('off-platform-warning')).toBeInTheDocument();
  });

  it('does not show warning for normal messages', async () => {
    const user = userEvent.setup();
    render(<MessagesPage />);

    const input = screen.getByTestId('message-input');
    await user.type(input, 'The pipeline is ready');

    expect(screen.queryByTestId('off-platform-warning')).not.toBeInTheDocument();
  });

  it('warning disappears when phone number is removed', async () => {
    const user = userEvent.setup();
    render(<MessagesPage />);

    const input = screen.getByTestId('message-input');
    await user.type(input, '9876543210');
    expect(screen.getByTestId('off-platform-warning')).toBeInTheDocument();

    await user.clear(input);
    await user.type(input, 'Normal message');
    expect(screen.queryByTestId('off-platform-warning')).not.toBeInTheDocument();
  });
});

describe('MessagesPage — message request accept/decline', () => {
  it('renders pending request with Accept/Decline buttons', () => {
    render(<MessagesPage />);
    // conv-3 is a pending request
    expect(screen.getByTestId('accept-request-conv-3')).toBeInTheDocument();
    expect(screen.getByTestId('decline-request-conv-3')).toBeInTheDocument();
  });

  it('accepting request removes Accept/Decline buttons without page reload', async () => {
    const user = userEvent.setup();
    render(<MessagesPage />);

    await user.click(screen.getByTestId('accept-request-conv-3'));

    // Buttons should be gone — state updated in-place
    expect(screen.queryByTestId('accept-request-conv-3')).not.toBeInTheDocument();
    expect(screen.queryByTestId('decline-request-conv-3')).not.toBeInTheDocument();
  });

  it('declining request removes Accept/Decline buttons without page reload', async () => {
    const user = userEvent.setup();
    render(<MessagesPage />);

    await user.click(screen.getByTestId('decline-request-conv-3'));

    expect(screen.queryByTestId('accept-request-conv-3')).not.toBeInTheDocument();
    expect(screen.queryByTestId('decline-request-conv-3')).not.toBeInTheDocument();
  });

  it('conversation list updates immediately after accept (no reload)', async () => {
    const user = userEvent.setup();
    render(<MessagesPage />);

    // Verify request exists before
    expect(screen.getByTestId('accept-request-conv-3')).toBeInTheDocument();

    // Accept
    await user.click(screen.getByTestId('accept-request-conv-3'));

    // Conversation item still exists (not removed, just updated)
    expect(screen.getByTestId('conv-item-conv-3')).toBeInTheDocument();
  });
});

describe('MessagesPage — file upload progress', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    // Mock URL.createObjectURL
    global.URL.createObjectURL = jest.fn().mockReturnValue('blob:test');
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows upload progress when file is attached', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<MessagesPage />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });

    await user.upload(fileInput, file);

    // Progress bar should appear
    expect(screen.getByTestId('upload-progress')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('upload progress completes and disappears', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<MessagesPage />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });

    await user.upload(fileInput, file);

    // Advance past the upload simulation (5 intervals × 200ms + 1200ms total)
    await act(async () => { jest.advanceTimersByTime(1500); });

    // Progress bar should be gone
    expect(screen.queryByTestId('upload-progress')).not.toBeInTheDocument();
  });
});

describe('MessagesPage — send message', () => {
  it('sends message on Enter key', async () => {
    const user = userEvent.setup();
    render(<MessagesPage />);

    const input = screen.getByTestId('message-input');
    await user.type(input, 'Hello world{Enter}');

    // Input should be cleared after send
    expect(input).toHaveValue('');
  });

  it('send button is disabled when input is empty', () => {
    render(<MessagesPage />);
    expect(screen.getByTestId('send-message-btn')).toBeDisabled();
  });

  it('send button enables when input has text', async () => {
    const user = userEvent.setup();
    render(<MessagesPage />);

    await user.type(screen.getByTestId('message-input'), 'Hello');
    expect(screen.getByTestId('send-message-btn')).not.toBeDisabled();
  });
});
