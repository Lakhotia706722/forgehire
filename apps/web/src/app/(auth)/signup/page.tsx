'use client';

import * as React from 'react';
import { useSignUp } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageTransition } from '@/components/ui/page-transition';

type Step = 'credentials' | 'role';
type Role = 'engineer' | 'company';

export default function SignupPage() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();

  const [step, setStep] = React.useState<Step>('credentials');
  const [prevStep, setPrevStep] = React.useState<Step | null>(null);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [role, setRole] = React.useState<Role | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [errors, setErrors] = React.useState<{ email?: string; password?: string }>({});

  function goToStep(next: Step) {
    setPrevStep(step);
    setStep(next);
  }

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    const newErrors: typeof errors = {};
    if (!email) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Enter a valid email';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 8) newErrors.password = 'Minimum 8 characters';
    if (Object.keys(newErrors).length) { setErrors(newErrors); return; }
    setErrors({});
    goToStep('role');
  }

  async function handleSignup() {
    if (!isLoaded || !role) return;
    setLoading(true);
    try {
      await signUp.create({
        emailAddress: email,
        password,
        unsafeMetadata: { role },
      });
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      router.push('/verify-otp');
    } catch (err: any) {
      const msg = err?.errors?.[0]?.longMessage ?? err?.message ?? 'Signup failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignup() {
    if (!isLoaded) return;
    try {
      await signUp.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/engineer/dashboard',
      });
    } catch (err: any) {
      toast.error(err?.errors?.[0]?.longMessage ?? 'Google sign-up failed');
    }
  }

  const isSlideIn  = prevStep === null || (prevStep === 'credentials' && step === 'role');
  const isSlideOut = prevStep === 'role' && step === 'credentials';

  return (
    <PageTransition>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            {[0, 1].map((i) => (
              <div
                key={i}
                className={cn(
                  'transition-all duration-300',
                  i === (step === 'credentials' ? 0 : 1)
                    ? 'w-6 h-2 rounded-full bg-accent-cyan'
                    : 'w-2 h-2 rounded-full bg-[rgba(255,255,255,0.15)]'
                )}
              />
            ))}
          </div>
          <h1 className="font-display text-3xl font-bold text-text-primary">
            {step === 'credentials' ? 'Create your account' : 'What brings you here?'}
          </h1>
          <p className="mt-2 text-text-secondary text-sm">
            {step === 'credentials'
              ? 'Join India\'s AI talent marketplace'
              : 'Choose your role to personalise your experience'}
          </p>
        </div>

        {/* Step: Credentials */}
        {step === 'credentials' && (
          <div
            key="credentials"
            className={cn(
              'space-y-5',
              isSlideOut ? 'animate-slide-out-left' : 'animate-slide-in-right'
            )}
          >
            <form onSubmit={handleCredentials} className="space-y-4" noValidate>
              <Input
                label="Email address"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
              />
              <Input
                label="Password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
                hint="Minimum 8 characters"
              />
              <Button type="submit" className="w-full" size="lg">
                Continue
              </Button>
            </form>

            <div className="relative flex items-center gap-3">
              <div className="flex-1 h-px bg-[rgba(255,255,255,0.06)]" />
              <span className="text-xs text-text-muted">or</span>
              <div className="flex-1 h-px bg-[rgba(255,255,255,0.06)]" />
            </div>

            <Button
              variant="secondary"
              className="w-full"
              size="lg"
              onClick={handleGoogleSignup}
              type="button"
            >
              <GoogleIcon />
              Continue with Google
            </Button>

            <p className="text-center text-sm text-text-secondary">
              Already have an account?{' '}
              <a href="/login" className="text-accent-cyan hover:underline">
                Sign in
              </a>
            </p>
          </div>
        )}

        {/* Step: Role selector */}
        {step === 'role' && (
          <div
            key="role"
            className={cn(
              'space-y-4',
              isSlideIn ? 'animate-slide-in-right' : 'animate-slide-out-left'
            )}
          >
            <div className="grid grid-cols-2 gap-4">
              <RoleCard
                selected={role === 'engineer'}
                onClick={() => setRole('engineer')}
                accent="cyan"
                icon={<EngineerIcon />}
                title="AI Engineer"
                description="Showcase skills, get verified, find projects & full-time roles"
              />
              <RoleCard
                selected={role === 'company'}
                onClick={() => setRole('company')}
                accent="violet"
                icon={<CompanyIcon />}
                title="Hiring / Company"
                description="Find vetted AI talent, post tasks, build your AI team"
              />
            </div>

            <Button
              className="w-full"
              size="lg"
              disabled={!role}
              loading={loading}
              onClick={handleSignup}
            >
              {role ? `Join as ${role === 'engineer' ? 'Engineer' : 'Company'}` : 'Select a role'}
            </Button>

            <button
              type="button"
              onClick={() => goToStep('credentials')}
              className="w-full text-sm text-text-muted hover:text-text-secondary transition-colors"
            >
              ← Back
            </button>
          </div>
        )}
      </div>
    </PageTransition>
  );
}

/* ── Role Card ─────────────────────────────────────────────── */
interface RoleCardProps {
  selected: boolean;
  onClick: () => void;
  accent: 'cyan' | 'violet';
  icon: React.ReactNode;
  title: string;
  description: string;
}

function RoleCard({ selected, onClick, accent, icon, title, description }: RoleCardProps) {
  const accentColor = accent === 'cyan' ? '#00D4FF' : '#7B5EA7';
  const borderColor = accent === 'cyan'
    ? 'rgba(0,212,255,0.5)'
    : 'rgba(123,94,167,0.6)';
  const bgColor = accent === 'cyan'
    ? 'rgba(0,212,255,0.04)'
    : 'rgba(123,94,167,0.06)';

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative flex flex-col items-start gap-3 p-5 rounded-xl text-left',
        'border transition-all duration-300',
        'hover:-translate-y-0.5',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base',
        selected
          ? 'bg-[var(--bg)] border-[var(--border)]'
          : 'bg-bg-surface border-[rgba(255,255,255,0.06)] hover:border-[var(--border)]'
      )}
      style={{
        '--bg': bgColor,
        '--border': borderColor,
      } as React.CSSProperties}
      aria-pressed={selected ? "true" : "false"}
    >
      {/* Checkmark */}
      {selected && (
        <span
          className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
          style={{ background: accentColor }}
        >
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
            <path d="M1 4L3.5 6.5L9 1" stroke="#080B14" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      )}

      <span style={{ color: accentColor }}>{icon}</span>
      <div>
        <p className="font-display font-semibold text-text-primary text-sm">{title}</p>
        <p className="text-text-muted text-xs mt-1 leading-relaxed">{description}</p>
      </div>
    </button>
  );
}

/* ── Icons ─────────────────────────────────────────────────── */
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

function EngineerIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2L2 7l10 5 10-5-10-5z"/>
      <path d="M2 17l10 5 10-5"/>
      <path d="M2 12l10 5 10-5"/>
    </svg>
  );
}

function CompanyIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="7" width="20" height="14" rx="2"/>
      <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
      <line x1="12" y1="12" x2="12" y2="16"/>
      <line x1="10" y1="14" x2="14" y2="14"/>
    </svg>
  );
}
