'use client';

import * as React from 'react';
import { useSignIn } from '@clerk/nextjs';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageTransition } from '@/components/ui/page-transition';

export default function ForgotPasswordPage() {
  const { isLoaded, signIn } = useSignIn();
  const [email, setEmail] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [error, setError] = React.useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoaded || !email.trim()) { setError('Email is required'); return; }
    setError('');
    setLoading(true);
    try {
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: email,
      });
      setSent(true);
    } catch (err: any) {
      const msg = err?.errors?.[0]?.longMessage ?? 'Failed to send reset email';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageTransition>
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-text-primary">Reset password</h1>
          <p className="mt-2 text-text-secondary text-sm">
            {sent ? 'Check your inbox for a reset code.' : "Enter your email and we'll send a reset code."}
          </p>
        </div>

        {sent ? (
          <div className="space-y-6">
            <div className="p-4 bg-[rgba(16,185,129,0.08)] border border-[rgba(16,185,129,0.2)] rounded-xl">
              <p className="text-sm text-accent-green font-medium mb-1">Email sent!</p>
              <p className="text-xs text-text-secondary">
                We sent a reset code to <strong>{email}</strong>. Check your inbox and follow the link to reset your password.
              </p>
            </div>
            <a
              href="/login"
              className="block text-center text-sm text-accent-cyan hover:underline"
            >
              ← Back to sign in
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Input
              label="Email address"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={error}
            />
            <Button type="submit" className="w-full" size="lg" loading={loading}>
              Send reset code
            </Button>
            <p className="text-center text-sm text-text-secondary">
              Remember your password?{' '}
              <a href="/login" className="text-accent-cyan hover:underline">Sign in</a>
            </p>
          </form>
        )}
      </div>
    </PageTransition>
  );
}
