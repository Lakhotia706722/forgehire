'use client';

import * as React from 'react';
import { useSignIn } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageTransition } from '@/components/ui/page-transition';

export default function ResetPasswordPage() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();
  const [code, setCode] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirm, setConfirm] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [errors, setErrors] = React.useState<{ code?: string; password?: string; confirm?: string }>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoaded) return;

    const newErrors: typeof errors = {};
    if (!code.trim()) newErrors.code = 'Reset code is required';
    if (password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (password !== confirm) newErrors.confirm = 'Passwords do not match';
    if (Object.keys(newErrors).length) { setErrors(newErrors); return; }
    setErrors({});

    setLoading(true);
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code,
        password,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        toast.success('Password reset successfully!');
        router.push('/engineer/dashboard');
      }
    } catch (err: any) {
      const msg = err?.errors?.[0]?.longMessage ?? 'Failed to reset password';
      if (msg.toLowerCase().includes('code')) {
        setErrors({ code: 'Invalid or expired code' });
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageTransition>
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-text-primary">Set new password</h1>
          <p className="mt-2 text-text-secondary text-sm">
            Enter the code from your email and choose a new password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Input
            label="Reset code"
            type="text"
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            error={errors.code}
          />
          <Input
            label="New password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
          />
          <Input
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            error={errors.confirm}
          />
          <Button type="submit" className="w-full" size="lg" loading={loading}>
            Reset password
          </Button>
        </form>

        <p className="text-center text-sm text-text-secondary">
          <a href="/forgot-password" className="text-accent-cyan hover:underline">
            Resend reset code
          </a>
        </p>
      </div>
    </PageTransition>
  );
}
