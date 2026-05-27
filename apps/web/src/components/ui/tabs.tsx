'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { AriaNavButton } from '@/components/ui/aria-tab-button';

interface TabsContextValue {
  active: string;
  setActive: (id: string) => void;
}

const TabsContext = React.createContext<TabsContextValue>({ active: '', setActive: () => {} });

interface TabsProps {
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function Tabs({ defaultValue, value, onValueChange, children, className }: TabsProps) {
  const [internal, setInternal] = React.useState(defaultValue);
  const active = value ?? internal;

  function setActive(id: string) {
    setInternal(id);
    onValueChange?.(id);
  }

  return (
    <TabsContext.Provider value={{ active, setActive }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
  /** Accessible name for the tab navigation region */
  'aria-label'?: string;
}

export function TabsList({ children, className, 'aria-label': ariaLabel }: TabsListProps) {
  return (
    <nav
      aria-label={ariaLabel ?? 'Sections'}
      className={cn(
        'flex items-center gap-1 border-b border-[rgba(255,255,255,0.06)]',
        className
      )}
    >
      {children}
    </nav>
  );
}

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export function TabsTrigger({ value, children, className, disabled }: TabsTriggerProps) {
  const { active, setActive } = React.useContext(TabsContext);
  const isActive = active === value;

  return (
    <AriaNavButton
      current={isActive}
      id={`tab-${value}`}
      disabled={disabled}
      onClick={() => setActive(value)}
      className={cn(
        'relative px-4 py-2.5 text-sm font-medium transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan focus-visible:ring-inset',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        isActive
          ? 'text-text-primary'
          : 'text-text-muted hover:text-text-secondary',
        className
      )}
    >
      {children}
      {isActive && (
        <span
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-cyan rounded-full animate-fade-up"
          aria-hidden="true"
        />
      )}
    </AriaNavButton>
  );
}

interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export function TabsContent({ value, children, className }: TabsContentProps) {
  const { active } = React.useContext(TabsContext);
  if (active !== value) return null;

  return (
    <div
      id={`tabpanel-${value}`}
      aria-labelledby={`tab-${value}`}
      className={cn('animate-fade-up', className)}
    >
      {children}
    </div>
  );
}
