'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { NeuronScoreRing } from '@/components/ui/neuron-score-ring';

const NAV_ITEMS = [
  { href: '/engineer/dashboard',  label: 'Dashboard',      icon: DashboardIcon },
  { href: '/engineer/profile',    label: 'Profile',         icon: ProfileIcon },
  { href: '/engineer/bounties',   label: 'Bounties',        icon: BountyIcon },
  { href: '/engineer/contracts',  label: 'Contracts',       icon: ContractIcon },
  { href: '/engineer/marketplace',label: 'Marketplace',     icon: MarketIcon },
  { href: '/engineer/messages',   label: 'Messages',        icon: MessageIcon },
  { href: '/engineer/wallet',     label: 'Wallet',          icon: WalletIcon },
  { href: '/engineer/analytics',  label: 'Analytics',       icon: AnalyticsIcon },
  { href: '/engineer/neuron-score', label: 'NeuronScore',   icon: ScoreIcon },
  { href: '/engineer/settings',   label: 'Settings',        icon: SettingsIcon },
];

export function EngineerSidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="hidden md:flex flex-col w-60 shrink-0 border-r border-[rgba(255,255,255,0.06)] bg-bg-surface min-h-screen sticky top-0 h-screen overflow-y-auto"
      aria-label="Engineer navigation"
    >
      {/* Logo */}
      <div className="px-5 py-5 border-b border-[rgba(255,255,255,0.06)]">
        <Link href="/" className="flex items-center gap-2" aria-label="NeuronHire home">
          <div className="w-7 h-7 rounded-lg bg-accent-cyan flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" stroke="#080B14" strokeWidth="1.5" strokeLinejoin="round"/>
              <circle cx="8" cy="8" r="2" fill="#080B14"/>
            </svg>
          </div>
          <span className="font-display font-bold text-text-primary text-base">NeuronHire</span>
        </Link>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan focus-visible:ring-inset',
                active
                  ? 'bg-[rgba(0,212,255,0.08)] text-accent-cyan border-l-2 border-accent-cyan pl-[10px]'
                  : 'text-text-muted hover:text-text-secondary hover:bg-[rgba(255,255,255,0.03)]'
              )}
              aria-current={active ? 'page' : undefined}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: engineer card */}
      <div className="px-3 py-4 border-t border-[rgba(255,255,255,0.06)]">
        <Link
          href="/engineer/profile"
          className="flex items-center gap-3 p-3 rounded-xl hover:bg-[rgba(255,255,255,0.03)] transition-colors group"
        >
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center font-display font-bold text-bg-base text-xs shrink-0"
            style={{ background: '#F59E0B' }}
            aria-hidden="true"
          >
            AS
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">Arjun Sharma</p>
            <p className="text-xs text-text-muted">View Profile →</p>
          </div>
          <NeuronScoreRing score={920} size={36} strokeWidth={3} animate={false} />
        </Link>
      </div>
    </aside>
  );
}

function DashboardIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/><rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/></svg>;
}
function ProfileIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="8" cy="5" r="3"/><path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6"/></svg>;
}
function JobsIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="4" width="12" height="10" rx="1"/><path d="M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1"/><line x1="8" y1="8" x2="8" y2="11"/><line x1="6" y1="9.5" x2="10" y2="9.5"/></svg>;
}
function BountyIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2"/></svg>;
}
function ContractIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 1H3a1 1 0 00-1 1v12a1 1 0 001 1h10a1 1 0 001-1V6L9 1z"/><path d="M9 1v5h5"/></svg>;
}
function MarketIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 3h12l-1.5 6H3.5L2 3z"/><circle cx="5.5" cy="13" r="1"/><circle cx="11.5" cy="13" r="1"/></svg>;
}
function MessageIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 2H2a1 1 0 00-1 1v8a1 1 0 001 1h3l3 3 3-3h3a1 1 0 001-1V3a1 1 0 00-1-1z"/></svg>;
}
function WalletIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="1" y="4" width="14" height="10" rx="1"/><path d="M1 8h14"/><circle cx="11" cy="11" r="1" fill="currentColor"/></svg>;
}
function AnalyticsIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="1 11 5 7 9 9 15 3"/><line x1="1" y1="14" x2="15" y2="14"/></svg>;
}
function ScoreIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2"/></svg>;
}
function SettingsIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="8" cy="8" r="2"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41"/></svg>;
}
