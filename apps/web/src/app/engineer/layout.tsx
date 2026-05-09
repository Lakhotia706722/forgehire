'use client';

import * as React from 'react';
import { EngineerSidebar } from '@/components/layout/engineer-sidebar';
import { CommandPalette, useCommandPalette } from '@/components/ui/command-palette';

export default function EngineerLayout({ children }: { children: React.ReactNode }) {
  const { open, close } = useCommandPalette();

  return (
    <div className="flex min-h-screen bg-bg-base">
      {/* Skip to main content — accessibility */}
      <a href="#main-content" className="skip-to-main">
        Skip to main content
      </a>

      <EngineerSidebar />

      <main id="main-content" className="flex-1 min-w-0" tabIndex={-1}>
        {children}
      </main>

      {/* Global command palette — Cmd/Ctrl+K */}
      <CommandPalette open={open} onClose={close} />
    </div>
  );
}
