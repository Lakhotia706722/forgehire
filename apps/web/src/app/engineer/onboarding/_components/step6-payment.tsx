'use client';
import * as React from 'react';
import { Input } from '@/components/ui/input';
import type { OnboardingState } from '@/lib/onboarding-store';

const UPI_REGEX = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/;

interface Step6Props {
  state: OnboardingState;
  onChange: (patch: Partial<OnboardingState>) => void;
}

export function Step6Payment({ state, onChange }: Step6Props) {
  const [bankExpanded, setBankExpanded] = React.useState(false);
  const upiValid = !state.upiId || UPI_REGEX.test(state.upiId);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-text-primary mb-1">Payment Setup</h2>
        <p className="text-text-secondary text-sm">
          Required to receive payments. Your details are encrypted and secure.
        </p>
      </div>

      {/* UPI */}
      <div>
        <Input
          label="UPI ID"
          value={state.upiId}
          onChange={(e) => onChange({ upiId: e.target.value })}
          error={!upiValid ? 'Invalid UPI format (e.g. name@upi)' : undefined}
          hint="Format: name@bank (e.g. arjun@okicici)"
          placeholder=" "
        />
      </div>

      {/* KYC info card */}
      <div className="flex gap-3 p-4 bg-[rgba(245,158,11,0.06)] border border-[rgba(245,158,11,0.2)] rounded-xl">
        <svg width="18" height="18" viewBox="0 0 20 20" fill="#F59E0B" className="shrink-0 mt-0.5" aria-hidden="true">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
        </svg>
        <div>
          <p className="text-sm font-medium text-accent-amber">KYC Required for Large Withdrawals</p>
          <p className="text-xs text-text-secondary mt-0.5">
            For withdrawals above ₹50,000, Aadhaar + PAN verification is required under Indian regulations. You can complete KYC from your profile settings after onboarding.
          </p>
        </div>
      </div>

      {/* Bank account (collapsible) */}
      <div className="border border-[rgba(255,255,255,0.06)] rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setBankExpanded((e) => !e)}
          className="w-full flex items-center justify-between px-4 py-3.5 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
          aria-expanded={bankExpanded ? "true" : "false"}
        >
          <span>Bank Account (Optional)</span>
          <svg
            width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"
            className={`transition-transform duration-200 ${bankExpanded ? 'rotate-180' : ''}`}
            aria-hidden="true"
          >
            <path d="M4 6l4 4 4-4"/>
          </svg>
        </button>

        {bankExpanded && (
          <div className="px-4 pb-4 space-y-3 border-t border-[rgba(255,255,255,0.06)]">
            <p className="text-xs text-text-muted pt-3">
              Add bank account for NEFT/IMPS transfers (required for amounts above ₹1L).
            </p>
            <Input
              label="Account Holder Name"
              value={state.bankAccountName}
              onChange={(e) => onChange({ bankAccountName: e.target.value })}
            />
            <Input
              label="Account Number"
              value={state.bankAccountNumber}
              onChange={(e) => onChange({ bankAccountNumber: e.target.value })}
              type="password"
            />
            <Input
              label="IFSC Code"
              value={state.bankIfsc}
              onChange={(e) => onChange({ bankIfsc: e.target.value.toUpperCase() })}
              placeholder=" "
            />
          </div>
        )}
      </div>
    </div>
  );
}
