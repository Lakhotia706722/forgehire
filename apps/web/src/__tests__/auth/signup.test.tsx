import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SignupPage from '@/app/(auth)/signup/page';

describe('Signup — Role Selector', () => {
  it('renders step 1 (credentials) by default', () => {
    render(<SignupPage />);
    expect(screen.getByText('Create your account')).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('shows validation errors when submitting empty credentials', async () => {
    const user = userEvent.setup();
    render(<SignupPage />);
    await user.click(screen.getByRole('button', { name: /^continue$/i }));
    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
  });

  it('advances to role selector after valid credentials', async () => {
    const user = userEvent.setup();
    render(<SignupPage />);

    await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /^continue$/i }));

    expect(await screen.findByText(/what brings you here/i)).toBeInTheDocument();
    expect(screen.getByText('AI Engineer')).toBeInTheDocument();
    expect(screen.getByText(/hiring/i)).toBeInTheDocument();
  });

  it('selects engineer role and enables submit button', async () => {
    const user = userEvent.setup();
    render(<SignupPage />);

    // Go to step 2
    await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /^continue$/i }));

    // Select engineer
    const engineerCard = await screen.findByRole('button', { name: /ai engineer/i });
    await user.click(engineerCard);
    expect(engineerCard).toHaveAttribute('aria-pressed', 'true');

    // Submit button should now say "Join as Engineer"
    expect(screen.getByRole('button', { name: /join as engineer/i })).not.toBeDisabled();
  });

  it('selects company role correctly', async () => {
    const user = userEvent.setup();
    render(<SignupPage />);

    await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /^continue$/i }));

    const companyCard = await screen.findByRole('button', { name: /hiring/i });
    await user.click(companyCard);
    expect(companyCard).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /join as company/i })).not.toBeDisabled();
  });

  it('submit button is disabled when no role selected', async () => {
    const user = userEvent.setup();
    render(<SignupPage />);

    await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /^continue$/i }));

    await screen.findByText(/what brings you here/i);
    const submitBtn = screen.getByRole('button', { name: /select a role/i });
    expect(submitBtn).toBeDisabled();
  });

  it('back button returns to credentials step', async () => {
    const user = userEvent.setup();
    render(<SignupPage />);

    await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /^continue$/i }));

    await screen.findByText(/what brings you here/i);
    await user.click(screen.getByRole('button', { name: /back/i }));

    expect(await screen.findByText('Create your account')).toBeInTheDocument();
  });
});
