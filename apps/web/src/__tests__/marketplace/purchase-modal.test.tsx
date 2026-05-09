/**
 * Test: Razorpay checkout modal opens without redirect.
 * Test: Try Before Buy sandbox iframe loads with correct sandbox attributes.
 */
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PurchaseModal } from '@/app/(public)/marketplace/[id]/_components/purchase-modal';
import { TryBeforeBuy } from '@/app/(public)/marketplace/[id]/_components/try-before-buy';
import { MOCK_PRODUCTS } from '@/lib/marketplace-data';

const product = MOCK_PRODUCTS[0]; // RAG Pipeline — one_time

describe('PurchaseModal — opens without redirect', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders when open', () => {
    render(<PurchaseModal open={true} onClose={jest.fn()} product={product} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Order Summary')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<PurchaseModal open={false} onClose={jest.fn()} product={product} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows product name in summary', () => {
    render(<PurchaseModal open={true} onClose={jest.fn()} product={product} />);
    expect(screen.getByText(product.name)).toBeInTheDocument();
  });

  it('shows price with GST', () => {
    render(<PurchaseModal open={true} onClose={jest.fn()} product={product} />);
    // Product price is 4999 — check subtotal row exists
    expect(screen.getByText('Subtotal')).toBeInTheDocument();
    expect(screen.getByText('GST (18%)')).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();
  });

  it('shows 30-day buyer protection', () => {
    render(<PurchaseModal open={true} onClose={jest.fn()} product={product} />);
    expect(screen.getByText(/30-day buyer protection/i)).toBeInTheDocument();
  });

  it('advances to payment step without redirect', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<PurchaseModal open={true} onClose={jest.fn()} product={product} />);

    await user.click(screen.getByRole('button', { name: /proceed to payment/i }));

    // Should show payment form, NOT redirect
    expect(screen.getByText('Secure Payment')).toBeInTheDocument();
    expect(screen.getByTestId('card-number-input')).toBeInTheDocument();
    // URL should not have changed (no redirect)
    expect(window.location.href).toBe('http://localhost/');
  });

  it('shows Razorpay branding on payment step', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<PurchaseModal open={true} onClose={jest.fn()} product={product} />);
    await user.click(screen.getByRole('button', { name: /proceed to payment/i }));
    expect(screen.getByText('Razorpay')).toBeInTheDocument();
  });

  it('shows success screen after payment', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<PurchaseModal open={true} onClose={jest.fn()} product={product} />);

    await user.click(screen.getByRole('button', { name: /proceed to payment/i }));
    await user.click(screen.getByTestId('pay-now-btn'));

    // Flush the 2000ms setTimeout using runAllTimersAsync
    await act(async () => {
      await jest.runAllTimersAsync();
    });

    expect(screen.getByText('Purchase Successful!')).toBeInTheDocument();
    expect(screen.getByTestId('access-purchase-btn')).toBeInTheDocument();
  });

  it('can go back from payment to summary', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<PurchaseModal open={true} onClose={jest.fn()} product={product} />);

    await user.click(screen.getByRole('button', { name: /proceed to payment/i }));
    await user.click(screen.getByRole('button', { name: /back to summary/i }));

    expect(screen.getByText('Order Summary')).toBeInTheDocument();
  });

  it('calls onClose when success access button is clicked', async () => {
    const onClose = jest.fn();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<PurchaseModal open={true} onClose={onClose} product={product} />);

    await user.click(screen.getByRole('button', { name: /proceed to payment/i }));
    await user.click(screen.getByTestId('pay-now-btn'));

    await act(async () => {
      await jest.runAllTimersAsync();
    });

    await user.click(screen.getByTestId('access-purchase-btn'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('TryBeforeBuy — sandbox iframe attributes', () => {
  it('renders the try-before-buy component', () => {
    render(<TryBeforeBuy productName="Test Product" demoUrl="https://demo.example.com" />);
    expect(screen.getByTestId('try-before-buy')).toBeInTheDocument();
  });

  it('shows "Live Demo" badge', () => {
    render(<TryBeforeBuy productName="Test Product" demoUrl="https://demo.example.com" />);
    expect(screen.getByText('Live Demo')).toBeInTheDocument();
  });

  it('renders iframe in embedded mode', () => {
    render(<TryBeforeBuy productName="Test Product" demoUrl="https://demo.example.com" />);
    const iframe = screen.getByTestId('demo-iframe');
    expect(iframe).toBeInTheDocument();
  });

  it('iframe has correct sandbox attribute — no allow-same-origin', () => {
    render(<TryBeforeBuy productName="Test Product" demoUrl="https://demo.example.com" />);
    const iframe = screen.getByTestId('demo-iframe');
    const sandbox = iframe.getAttribute('sandbox') ?? '';

    // Must have allow-scripts for interactivity
    expect(sandbox).toContain('allow-scripts');

    // Must NOT have allow-same-origin (security requirement)
    expect(sandbox).not.toContain('allow-same-origin');
  });

  it('iframe sandbox allows forms and popups', () => {
    render(<TryBeforeBuy productName="Test Product" demoUrl="https://demo.example.com" />);
    const iframe = screen.getByTestId('demo-iframe');
    const sandbox = iframe.getAttribute('sandbox') ?? '';
    expect(sandbox).toContain('allow-forms');
    expect(sandbox).toContain('allow-popups');
  });

  it('iframe has correct src', () => {
    render(<TryBeforeBuy productName="Test Product" demoUrl="https://demo.example.com" />);
    const iframe = screen.getByTestId('demo-iframe');
    expect(iframe).toHaveAttribute('src', 'https://demo.example.com');
  });

  it('shows API test mode when no demoUrl', () => {
    render(<TryBeforeBuy productName="Test Product" />);
    expect(screen.queryByTestId('demo-iframe')).not.toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /test input/i })).toBeInTheDocument();
  });

  it('can switch to API test mode', async () => {
    const user = userEvent.setup();
    render(<TryBeforeBuy productName="Test Product" demoUrl="https://demo.example.com" />);

    await user.click(screen.getByRole('button', { name: /api test/i }));
    expect(screen.queryByTestId('demo-iframe')).not.toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /test input/i })).toBeInTheDocument();
  });
});
