'use client';

import * as React from 'react';
import { useSignUp } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { OTPInput } from '@/components/ui/otp-input';
import { PageTransition } from '@/components/ui/page-transition';

const RESEND_COOLDOWN = 60; // seconds

export default function VerifyOTPPage() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();

  const [otp, setOtp] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(false);
  const [countdown, setCountdown] = React.useState(RESEND_COOLDOWN);
  const [resending, setResending] = React.useState(false);

  // Countdown timer
  React.useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  async function handleVerify(code: string) {
    if (!isLoaded || code.length < 6) return;
    setLoading(true);
    setError(false);
    try {
      const result = await signUp.attemptEmailAddressVerification({ code });
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        toast.success('Email verified! Welcome to NeuronHire.');
        // Route based on role
        const role = (result.createdUserId && signUp.unsafeMetadata?.role) as string | undefined;
        router.push(role === 'company' ? '/company/dashboard' : '/engineer/dashboard');
      } else {
        setError(true);
        toast.error('Verification incomplete. Please try again.');
      }
    } catch (err: any) {
      setError(true);
      const msg = err?.errors?.[0]?.longMessage ?? 'Invalid code. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!isLoaded || countdown > 0) return;
    setResending(true);
    try {
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setCountdown(RESEND_COOLDOWN);
      setOtp('');
      setError(false);
      toast.success('New code sent to your email.');
    } catch (err: any) {
      toast.error(err?.errors?.[0]?.longMessage ?? 'Failed to resend code.');
    } finally {
      setResending(false);
    }
  }

  const email = signUp?.emailAddress ?? 'your email';

  return (
    <PageTransition>
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="w-12 h-12 rounded-xl bg-[rgba(0,212,255,0.1)] border border-[rgba(0,212,255,0.2)] flex items-center justify-center mb-4">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00D4FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
          </div>
          <h1 className="font-display text-3xl font-bold text-text-primary">
            Check your email
          </h1>
          <p className="text-text-secondary text-sm leading-relaxed">
            We sent a 6-digit code to{' '}
            <span className="text-accent-cyan font-medium">{email}</span>.
            Enter it below to verify your account.
          </p>
        </div>

        {/* OTP Input */}
        <div className="space-y-6">
          <div>
            <OTPInput
              value={otp}
              onChange={(val) => {
                setOtp(val);
                if (error) setError(false);
              }}
              onComplete={handleVerify}
              error={error}
              disabled={loading}
            />
            {error && (
              <p className="mt-3 text-sm text-accent-red flex items-center gap-1.5">
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                  <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 3.75h1.5v4.5h-1.5v-4.5zm0 6h1.5v1.5h-1.5v-1.5z"/>
                </svg>
                Invalid code. Please check and try again.
              </p>
            )}
          </div>

          <Button
            className="w-full"
            size="lg"
            loading={loading}
            disabled={otp.length < 6 || loading}
            onClick={() => handleVerify(otp)}
          >
            Verify email
          </Button>
        </div>

        {/* Resend */}
        <div className="text-center">
          <p className="text-sm text-text-secondary">
            Didn&apos;t receive the code?{' '}
            {countdown > 0 ? (
              <span className="text-text-muted font-mono">
                Resend in {countdown}s
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="text-accent-cyan hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resending ? 'Sending…' : 'Resend code'}
              </button>
            )}
          </p>
        </div>

        {/* Back link */}
        <div className="text-center">
          <a href="/signup" className="text-sm text-text-muted hover:text-text-secondary transition-colors">
            ← Back to sign up
          </a>
        </div>
      </div>
    </PageTransition>
  );
}
