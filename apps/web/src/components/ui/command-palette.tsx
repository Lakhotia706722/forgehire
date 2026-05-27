'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

/**
 * Global command palette — opens with Cmd/Ctrl+K.
 * Allows power users to navigate, search engineers, tasks, and products.
 */

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  action: () => void;
  keywords?: string[];
  group: string;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState('');
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  const navigate = React.useCallback(
    (href: string) => {
      router.push(href);
      onClose();
    },
    [router, onClose]
  );

  const COMMANDS: CommandItem[] = React.useMemo(
    () => [
      // Navigation
      { id: 'nav-dashboard', label: 'Dashboard', icon: <DashIcon />, action: () => navigate('/engineer/dashboard'), group: 'Navigate', keywords: ['home', 'overview'] },
      { id: 'nav-bounties', label: 'Browse Bounties', icon: <BountyIcon />, action: () => navigate('/engineer/bounties'), group: 'Navigate', keywords: ['tasks', 'work', 'earn'] },
      { id: 'nav-marketplace', label: 'Marketplace', icon: <MarketIcon />, action: () => navigate('/engineer/marketplace'), group: 'Navigate', keywords: ['products', 'templates', 'sell'] },
      { id: 'nav-wallet', label: 'My Wallet', icon: <WalletIcon />, action: () => navigate('/engineer/wallet'), group: 'Navigate', keywords: ['earnings', 'withdraw', 'money', 'payments'] },
      { id: 'nav-analytics', label: 'Analytics', icon: <AnalyticsIcon />, action: () => navigate('/engineer/analytics'), group: 'Navigate', keywords: ['stats', 'performance', 'insights'] },
      { id: 'nav-messages', label: 'Messages', icon: <MessageIcon />, action: () => navigate('/engineer/messages'), group: 'Navigate', keywords: ['chat', 'inbox', 'conversations'] },
      { id: 'nav-settings', label: 'Settings', icon: <SettingsIcon />, action: () => navigate('/engineer/settings'), group: 'Navigate', keywords: ['preferences', 'account', 'profile'] },
      { id: 'nav-market-rates', label: 'Market Rates', icon: <RatesIcon />, action: () => navigate('/market-rates'), group: 'Navigate', keywords: ['salary', 'rates', 'pricing', 'hourly'] },
      // Company
      { id: 'nav-browse', label: 'Find Engineers', icon: <SearchIcon />, action: () => navigate('/company/browse'), group: 'Company', keywords: ['hire', 'engineers', 'talent', 'search'] },
      { id: 'nav-post-task', label: 'Post a Task', icon: <PlusIcon />, action: () => navigate('/company/post-task'), group: 'Company', keywords: ['create', 'bounty', 'job', 'task'] },
      { id: 'nav-billing', label: 'Billing', icon: <BillingIcon />, action: () => navigate('/company/billing'), group: 'Company', keywords: ['invoice', 'escrow', 'payment', 'plan'] },
      // Admin
      { id: 'nav-admin', label: 'Admin Dashboard', icon: <AdminIcon />, action: () => navigate('/admin/dashboard'), group: 'Admin', keywords: ['admin', 'platform', 'manage'] },
    ],
    [navigate]
  );

  const filtered = React.useMemo(() => {
    if (!query.trim()) return COMMANDS;
    const q = query.toLowerCase();
    return COMMANDS.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(q) ||
        cmd.description?.toLowerCase().includes(q) ||
        cmd.keywords?.some((k) => k.includes(q)) ||
        cmd.group.toLowerCase().includes(q)
    );
  }, [query, COMMANDS]);

  // Group filtered results
  const grouped = React.useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};
    for (const item of filtered) {
      if (!groups[item.group]) groups[item.group] = [];
      groups[item.group].push(item);
    }
    return groups;
  }, [filtered]);

  const flatFiltered = filtered;

  // Reset selection when query changes
  React.useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Focus input when opened
  React.useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Keyboard navigation
  React.useEffect(() => {
    if (!open) return;

    function handleKey(e: KeyboardEvent) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, flatFiltered.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        flatFiltered[selectedIndex]?.action();
      } else if (e.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, flatFiltered, selectedIndex, onClose]);

  // Scroll selected item into view
  React.useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  if (!open) return null;

  let flatIndex = 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative w-full max-w-xl bg-bg-elevated border border-[rgba(255,255,255,0.1)] rounded-2xl shadow-2xl overflow-hidden animate-fade-up">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[rgba(255,255,255,0.06)]">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#8892A4" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
            <circle cx="6.5" cy="6.5" r="4.5"/>
            <path d="M10 10l3.5 3.5"/>
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages, actions…"
            className="flex-1 bg-transparent text-text-primary placeholder:text-text-muted text-sm outline-none"
            aria-label="Command search"
            aria-autocomplete="list"
            aria-controls="command-list"
            aria-activedescendant={flatFiltered[selectedIndex] ? `cmd-${flatFiltered[selectedIndex].id}` : undefined}
            role="combobox"
            aria-expanded="true"
          />
          <kbd className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded bg-[rgba(255,255,255,0.06)] text-text-muted text-xs font-mono">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div
          id="command-list"
          ref={listRef}
          role="listbox"
          aria-label="Command results"
          className="max-h-80 overflow-y-auto py-2"
        >
          {flatFiltered.length === 0 ? (
            <div className="px-4 py-8 text-center text-text-muted text-sm">
              No results for &ldquo;{query}&rdquo;
            </div>
          ) : (
            Object.entries(grouped).map(([group, items]) => (
              <div key={group}>
                <div className="px-4 py-1.5 text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                  {group}
                </div>
                {items.map((item) => {
                  const idx = flatIndex++;
                  const isSelected = idx === selectedIndex;
                  return (
                    <button
                      key={item.id}
                      id={`cmd-${item.id}`}
                      role="option"
                      aria-selected={isSelected ? "true" : "false"}
                      data-index={idx}
                      onClick={item.action}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                        isSelected
                          ? 'bg-[rgba(0,212,255,0.08)] text-text-primary'
                          : 'text-text-secondary hover:text-text-primary'
                      )}
                    >
                      <span className={cn('w-5 h-5 shrink-0', isSelected ? 'text-accent-cyan' : 'text-text-muted')} aria-hidden="true">
                        {item.icon}
                      </span>
                      <span className="flex-1 text-sm">{item.label}</span>
                      {item.description && (
                        <span className="text-xs text-text-muted hidden sm:block">{item.description}</span>
                      )}
                      {isSelected && (
                        <kbd className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[rgba(255,255,255,0.06)] text-text-muted text-xs font-mono shrink-0" aria-hidden="true">
                          ↵
                        </kbd>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-[rgba(255,255,255,0.06)] flex items-center gap-4 text-xs text-text-muted">
          <span className="flex items-center gap-1"><kbd className="font-mono">↑↓</kbd> navigate</span>
          <span className="flex items-center gap-1"><kbd className="font-mono">↵</kbd> select</span>
          <span className="flex items-center gap-1"><kbd className="font-mono">ESC</kbd> close</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook to wire up Cmd/Ctrl+K globally.
 */
export function useCommandPalette() {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  return { open, setOpen, close: () => setOpen(false) };
}

// ─── Icons ────────────────────────────────────────────────────
const iconProps = { width: 16, height: 16, viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: '1.5', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

function DashIcon() { return <svg {...iconProps} aria-hidden="true"><rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/><rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/></svg>; }
function BountyIcon() { return <svg {...iconProps} aria-hidden="true"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2"/></svg>; }
function MarketIcon() { return <svg {...iconProps} aria-hidden="true"><path d="M2 3h12l-1.5 6H3.5L2 3z"/><circle cx="5.5" cy="13" r="1"/><circle cx="11.5" cy="13" r="1"/></svg>; }
function WalletIcon() { return <svg {...iconProps} aria-hidden="true"><rect x="1" y="4" width="14" height="10" rx="1"/><path d="M1 8h14"/><circle cx="11" cy="11" r="1" fill="currentColor"/></svg>; }
function AnalyticsIcon() { return <svg {...iconProps} aria-hidden="true"><polyline points="1 11 5 7 9 9 15 3"/><line x1="1" y1="14" x2="15" y2="14"/></svg>; }
function MessageIcon() { return <svg {...iconProps} aria-hidden="true"><path d="M14 2H2a1 1 0 00-1 1v8a1 1 0 001 1h3l3 3 3-3h3a1 1 0 001-1V3a1 1 0 00-1-1z"/></svg>; }
function SettingsIcon() { return <svg {...iconProps} aria-hidden="true"><circle cx="8" cy="8" r="2"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41"/></svg>; }
function RatesIcon() { return <svg {...iconProps} aria-hidden="true"><line x1="1" y1="14" x2="15" y2="14"/><path d="M3 10l3-4 3 2 3-5 3 3"/></svg>; }
function SearchIcon() { return <svg {...iconProps} aria-hidden="true"><circle cx="6.5" cy="6.5" r="4.5"/><path d="M10 10l3.5 3.5"/></svg>; }
function PlusIcon() { return <svg {...iconProps} aria-hidden="true"><line x1="8" y1="2" x2="8" y2="14"/><line x1="2" y1="8" x2="14" y2="8"/></svg>; }
function BillingIcon() { return <svg {...iconProps} aria-hidden="true"><rect x="1" y="4" width="14" height="10" rx="1"/><path d="M1 8h14"/></svg>; }
function AdminIcon() { return <svg {...iconProps} aria-hidden="true"><path d="M8 1l2 4h4l-3 3 1 4-4-2-4 2 1-4-3-3h4z"/></svg>; }
