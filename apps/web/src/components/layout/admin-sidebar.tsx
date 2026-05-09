'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/admin/dashboard',    label: 'Overview',     icon: OverviewIcon },
  { href: '/admin/engineers',    label: 'Engineers',    icon: EngineersIcon },
  { href: '/admin/companies',    label: 'Companies',    icon: CompaniesIcon },
  { href: '/admin/assessments',  label: 'Assessments',  icon: AssessmentIcon },
  { href: '/admin/tasks',        label: 'Tasks',        icon: TasksIcon },
  { href: '/admin/marketplace',  label: 'Marketplace',  icon: MarketIcon },
  { href: '/admin/payments',     label: 'Payments',     icon: PaymentsIcon },
  { href: '/admin/disputes',     label: 'Disputes',     icon: DisputesIcon },
  { href: '/admin/moderation',   label: 'Moderation',   icon: ModerationIcon },
  { href: '/admin/settings',     label: 'Settings',     icon: SettingsIcon },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="hidden md:flex flex-col w-60 shrink-0 border-r border-[rgba(255,255,255,0.06)] bg-bg-surface min-h-screen sticky top-0 h-screen overflow-y-auto"
      aria-label="Admin navigation"
    >
      {/* Logo + Admin badge */}
      <div className="px-5 py-5 border-b border-[rgba(255,255,255,0.06)]">
        <Link href="/admin/dashboard" className="flex items-center gap-2" aria-label="NeuronHire Admin">
          <div className="w-7 h-7 rounded-lg bg-accent-amber flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" stroke="#080B14" strokeWidth="1.5" strokeLinejoin="round"/>
              <circle cx="8" cy="8" r="2" fill="#080B14"/>
            </svg>
          </div>
          <div>
            <span className="font-display font-bold text-text-primary text-sm block leading-none">NeuronHire</span>
            <span className="text-[10px] font-mono text-accent-amber tracking-wider">ADMIN</span>
          </div>
        </Link>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-0.5" aria-label="Admin sections">
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
                  ? 'bg-[rgba(245,158,11,0.08)] text-accent-amber border-l-2 border-accent-amber pl-[10px]'
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

      {/* Bottom: admin user */}
      <div className="px-3 py-4 border-t border-[rgba(255,255,255,0.06)]">
        <div className="flex items-center gap-3 p-3 rounded-xl">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center font-display font-bold text-bg-base text-xs shrink-0 bg-accent-amber"
            aria-hidden="true"
          >
            AD
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">Admin</p>
            <p className="text-xs text-text-muted">Platform Admin</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

// ─── Icons ────────────────────────────────────────────────────
function OverviewIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/><rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/></svg>;
}
function EngineersIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="6" cy="5" r="3"/><path d="M1 14c0-2.8 2.2-5 5-5"/><circle cx="12" cy="10" r="2"/><path d="M10 14v-1a2 2 0 014 0v1"/></svg>;
}
function CompaniesIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="3" width="12" height="11" rx="1"/><path d="M5 3V2M11 3V2M2 7h12"/><rect x="5" y="10" width="2" height="4"/></svg>;
}
function AssessmentIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="1" width="12" height="14" rx="1"/><line x1="5" y1="5" x2="11" y2="5"/><line x1="5" y1="8" x2="11" y2="8"/><line x1="5" y1="11" x2="8" y2="11"/></svg>;
}
function TasksIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2"/></svg>;
}
function MarketIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 3h12l-1.5 6H3.5L2 3z"/><circle cx="5.5" cy="13" r="1"/><circle cx="11.5" cy="13" r="1"/></svg>;
}
function PaymentsIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="1" y="4" width="14" height="10" rx="1"/><path d="M1 8h14"/><circle cx="11" cy="11" r="1" fill="currentColor"/></svg>;
}
function DisputesIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 2l1.5 3h3.5l-2.8 2 1 3.5L8 9l-3.2 1.5 1-3.5L3 5h3.5z"/></svg>;
}
function ModerationIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 1l2 5h5l-4 3 1.5 5L8 11l-4.5 3L5 9 1 6h5z"/></svg>;
}
function SettingsIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="8" cy="8" r="2"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41"/></svg>;
}
