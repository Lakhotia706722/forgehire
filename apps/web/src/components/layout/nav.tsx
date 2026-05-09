import Link from 'next/link';
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';

export function Nav() {
  return (
    <nav
      className="border-b border-[rgba(255,255,255,0.06)] bg-bg-base/80 backdrop-blur-sm sticky top-0 z-50"
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group" aria-label="NeuronHire home">
          <div className="w-7 h-7 rounded-lg bg-accent-cyan flex items-center justify-center transition-transform group-hover:scale-105">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" stroke="#080B14" strokeWidth="1.5" strokeLinejoin="round"/>
              <circle cx="8" cy="8" r="2" fill="#080B14"/>
            </svg>
          </div>
          <span className="font-display font-bold text-text-primary text-lg">NeuronHire</span>
        </Link>

        {/* Center links */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/engineers" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
            Find Engineers
          </Link>
          <Link href="/marketplace" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
            Marketplace
          </Link>
          <Link href="/bounties" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
            Bounties
          </Link>
        </div>

        {/* Auth */}
        <div className="flex items-center gap-3">
          <SignedOut>
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Get started</Button>
            </Link>
          </SignedOut>
          <SignedIn>
            <Link href="/engineer/dashboard">
              <Button variant="secondary" size="sm">Dashboard</Button>
            </Link>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </div>
    </nav>
  );
}
