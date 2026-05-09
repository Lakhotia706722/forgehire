'use client';

import * as React from 'react';
import { useSignIn } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageTransition } from '@/components/ui/page-transition';

export default function LoginPage() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [errors, setErrors] = React.useState<{ email?: string; password?: string }>({});

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoaded) return;

    const newErrors: typeof errors = {};
    if (!email) newErrors.email = 'Email is required';
    if (!password) newErrors.password = 'Password is required';
    if (Object.keys(newErrors).length) { setErrors(newErrors); return; }
    setErrors({});

    setLoading(true);
    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        toast.success('Welcome back!');
        // Role-based redirect
        const role = (result.userData as any)?.publicMetadata?.role as string | undefined;
        router.push(role === 'company' ? '/company/dashboard' : '/engineer/dashboard');
      } else {
        toast.error('Sign-in incomplete. Please try again.');
      }
    } catch (err: any) {
      const msg = err?.errors?.[0]?.longMessage ?? err?.message ?? 'Invalid email or password';
      if (msg.toLowerCase().includes('password')) {
        setErrors({ password: msg });
      } else if (msg.toLowerCase().includes('email') || msg.toLowerCase().includes('identifier')) {
        setErrors({ email: msg });
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    if (!isLoaded) return;
    try {
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/engineer/dashboard',
      });
    } catch (err: any) {
      toast.error(err?.errors?.[0]?.longMessage ?? 'Google sign-in failed');
    }
  }

  return (
    <PageTransition>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="font-display text-3xl font-bold text-text-primary">
            Welcome back
          </h1>
          <p className="mt-2 text-text-secondary text-sm">
            Sign in to your NeuronHire account
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4" noValidate>
          <Input
            label="Email address"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
          />

          <div className="space-y-1">
            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
            />
            <div className="flex justify-end">
              <a
                href="/forgot-password"
                className="text-xs text-text-muted hover:text-accent-cyan transition-colors"
              >
                Forgot password?
              </a>
            </div>
          </div>

          <Button type="submit" className="w-full" size="lg" loading={loading}>
            Sign in
          </Button>
        </form>

        {/* Divider */}
        <div className="relative flex items-center gap-3">
          <div className="flex-1 h-px bg-[rgba(255,255,255,0.06)]" />
          <span className="text-xs text-text-muted">or</span>
          <div className="flex-1 h-px bg-[rgba(255,255,255,0.06)]" />
        </div>

        {/* Google */}
        <Button
          variant="secondary"
          className="w-full"
          size="lg"
          onClick={handleGoogleLogin}
          type="button"
        >
          <GoogleIcon />
          Continue with Google
        </Button>

        {/* Sign up link */}
        <p className="text-center text-sm text-text-secondary">
          Don&apos;t have an account?{' '}
          <a href="/signup" className="text-accent-cyan hover:underline">
            Create one free
          </a>
        </p>
      </div>
    </PageTransition>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}
