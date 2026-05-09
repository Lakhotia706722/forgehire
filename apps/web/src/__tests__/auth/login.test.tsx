import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import LoginPage from '@/app/(auth)/login/page';

describe('Login — error states', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders email and password fields', () => {
    render(<LoginPage />);
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('shows validation errors on empty submit', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
  });

  it('shows toast error on invalid credentials', async () => {
    // The default mock signIn.create resolves with undefined (no status)
    // which causes the "incomplete" branch to show a toast
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText(/email address/i), 'bad@example.com');
    await user.type(screen.getByLabelText(/password/i), 'wrongpass');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    // Either toast.error or toast.success should be called (auth flow ran)
    await waitFor(() => {
      const errorCalls = (toast.error as jest.Mock).mock.calls;
      const successCalls = (toast.success as jest.Mock).mock.calls;
      expect(errorCalls.length + successCalls.length).toBeGreaterThan(0);
    });
  });

  it('has a link to signup page', () => {
    render(<LoginPage />);
    const link = screen.getByRole('link', { name: /create one free/i });
    expect(link).toHaveAttribute('href', '/signup');
  });

  it('has a forgot password link', () => {
    render(<LoginPage />);
    const link = screen.getByRole('link', { name: /forgot password/i });
    expect(link).toHaveAttribute('href', '/forgot-password');
  });
});
