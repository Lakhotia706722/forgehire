'use client';

import * as React from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatPrice, type ProductListing } from '@/lib/marketplace-data';

type PurchaseStep = 'summary' | 'payment' | 'success';

interface PurchaseModalProps {
  open: boolean;
  onClose: () => void;
  product: ProductListing;
  selectedTierId?: string;
}

export function PurchaseModal({ open, onClose, product, selectedTierId }: PurchaseModalProps) {
  const [step, setStep] = React.useState<PurchaseStep>('summary');
  const [processing, setProcessing] = React.useState(false);

  const tier = product.pricingTiers?.find((t) => t.id === selectedTierId);
  const price = tier ? tier.priceINR : product.priceINR;
  const priceLabel = tier ? `${tier.name} Plan` : formatPrice(product.priceINR, product.pricingModel);

  function handlePay() {
    setProcessing(true);
    // Simulate Razorpay checkout (in production: open Razorpay modal)
    setTimeout(() => {
      setProcessing(false);
      setStep('success');
    }, 2000);
  }

  function handleClose() {
    setStep('summary');
    setProcessing(false);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={step !== 'payment' ? handleClose : undefined}
      title={step === 'success' ? undefined : step === 'summary' ? 'Order Summary' : 'Secure Payment'}
      size="md"
    >
      {step === 'summary' && (
        <div className="p-6 space-y-5">
          {/* Product summary */}
          <div className="flex items-start gap-4 p-4 bg-bg-surface rounded-xl border border-[rgba(255,255,255,0.06)]">
            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${product.thumbnailGradient} shrink-0`} aria-hidden="true" />
            <div>
              <p className="font-semibold text-text-primary text-sm">{product.name}</p>
              <p className="text-xs text-text-muted mt-0.5">{priceLabel}</p>
              {tier && <p className="text-xs text-text-muted">{tier.billingCycle === 'monthly' ? 'Billed monthly' : 'Billed annually'}</p>}
            </div>
          </div>

          {/* Price breakdown */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-text-secondary">
              <span>Subtotal</span>
              <span className="font-mono">₹{price.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-text-secondary">
              <span>GST (18%)</span>
              <span className="font-mono">₹{Math.round(price * 0.18).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between font-semibold text-text-primary border-t border-[rgba(255,255,255,0.06)] pt-2">
              <span>Total</span>
              <span className="font-mono text-accent-amber">₹{Math.round(price * 1.18).toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* What you get */}
          <div>
            <p className="text-xs text-text-muted mb-2">What you get:</p>
            <ul className="space-y-1.5">
              {product.deliverables.map((d, i) => (
                <li key={i} className="flex items-center gap-2 text-xs text-text-secondary">
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M2 8l4 4 8-8"/>
                  </svg>
                  {d}
                </li>
              ))}
            </ul>
          </div>

          {/* 30-day protection */}
          <div className="flex items-center gap-2 px-3 py-2.5 bg-[rgba(16,185,129,0.06)] border border-[rgba(16,185,129,0.2)] rounded-xl">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="#10B981" aria-hidden="true">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
            </svg>
            <span className="text-xs text-accent-green">30-day buyer protection — full refund if not satisfied</span>
          </div>

          <Button size="lg" className="w-full" onClick={() => setStep('payment')}>
            Proceed to Payment →
          </Button>
        </div>
      )}

      {step === 'payment' && (
        <div className="p-6 space-y-5">
          <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl p-4 text-center">
            <p className="text-xs text-text-muted mb-2">Secure payment via</p>
            <div className="flex items-center justify-center gap-2">
              <div className="w-8 h-8 rounded bg-[rgba(0,212,255,0.1)] flex items-center justify-center">
                <span className="text-xs font-bold text-accent-cyan">R</span>
              </div>
              <span className="font-semibold text-text-primary">Razorpay</span>
            </div>
            <p className="text-xs text-text-muted mt-2">256-bit SSL encrypted</p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs text-text-muted mb-1.5">Card Number</label>
              <input
                type="text"
                placeholder="4242 4242 4242 4242"
                className="w-full bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,212,255,0.3)] font-mono"
                aria-label="Card number"
                data-testid="card-number-input"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-text-muted mb-1.5">Expiry</label>
                <input type="text" placeholder="MM/YY" className="w-full bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,212,255,0.3)] font-mono" aria-label="Expiry date" />
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-1.5">CVV</label>
                <input type="password" placeholder="•••" className="w-full bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,212,255,0.3)] font-mono" aria-label="CVV" />
              </div>
            </div>
          </div>

          <Button size="lg" className="w-full" loading={processing} onClick={handlePay} data-testid="pay-now-btn">
            Pay ₹{Math.round(price * 1.18).toLocaleString('en-IN')}
          </Button>
          <button onClick={() => setStep('summary')} className="w-full text-sm text-text-muted hover:text-text-secondary transition-colors">
            ← Back to summary
          </button>
        </div>
      )}

      {step === 'success' && (
        <div className="flex flex-col items-center justify-center py-12 gap-4 px-6 text-center">
          <div className="w-16 h-16 rounded-full bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.3)] flex items-center justify-center animate-fade-up">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
          </div>
          <h3 className="font-display font-bold text-xl text-text-primary">Purchase Successful!</h3>
          <p className="text-text-secondary text-sm">
            You now have access to <strong>{product.name}</strong>. A confirmation has been sent to your email.
          </p>
          <Button size="md" className="w-full" onClick={handleClose} data-testid="access-purchase-btn">
            Access Your Purchase →
          </Button>
        </div>
      )}
    </Modal>
  );
}
