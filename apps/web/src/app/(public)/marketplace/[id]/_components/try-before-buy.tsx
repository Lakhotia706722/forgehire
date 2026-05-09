'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface TryBeforeBuyProps {
  productName: string;
  demoUrl?: string;
}

export function TryBeforeBuy({ productName, demoUrl }: TryBeforeBuyProps) {
  const [input, setInput] = React.useState('');
  const [output, setOutput] = React.useState('');
  const [running, setRunning] = React.useState(false);
  const [mode, setMode] = React.useState<'iframe' | 'input'>(demoUrl ? 'iframe' : 'input');

  async function handleRun() {
    if (!input.trim()) return;
    setRunning(true);
    setOutput('');
    // Simulate API call
    await new Promise((r) => setTimeout(r, 1200));
    setOutput(`Demo output for: "${input}"\n\nThis is a simulated response from the ${productName} API. In production, this would call the actual product endpoint and return real results.`);
    setRunning(false);
  }

  return (
    <div
      className="bg-bg-surface border border-[rgba(0,212,255,0.15)] rounded-2xl overflow-hidden"
      id="demo"
      data-testid="try-before-buy"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[rgba(255,255,255,0.06)] bg-[rgba(0,212,255,0.04)]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent-green animate-pulse" aria-hidden="true" />
          <span className="text-xs font-mono text-accent-cyan font-medium">Live Demo</span>
        </div>
        {demoUrl && (
          <div className="flex gap-1">
            {(['iframe', 'input'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn(
                  'text-[10px] px-2 py-0.5 rounded transition-all',
                  mode === m ? 'bg-accent-cyan text-bg-base font-semibold' : 'text-text-muted hover:text-text-secondary'
                )}
              >
                {m === 'iframe' ? 'Embedded' : 'API Test'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      {mode === 'iframe' && demoUrl ? (
        <iframe
          src={demoUrl}
          title={`${productName} live demo`}
          className="w-full h-80"
          // Security: no allow-same-origin to prevent sandbox escape
          sandbox="allow-scripts allow-forms allow-popups"
          data-testid="demo-iframe"
          aria-label={`${productName} interactive demo`}
        />
      ) : (
        <div className="p-5 space-y-3">
          <p className="text-xs text-text-muted">Test the API with your own input:</p>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter your test input here..."
            rows={3}
            className="w-full bg-bg-elevated border border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,212,255,0.3)] resize-none transition-all font-mono"
            aria-label="Test input"
          />
          <Button size="sm" loading={running} onClick={handleRun} disabled={!input.trim()}>
            ▶ Run
          </Button>
          {output && (
            <div className="bg-bg-elevated border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
              <p className="text-[10px] text-text-muted font-mono mb-2">Output:</p>
              <pre className="text-xs text-accent-green font-mono whitespace-pre-wrap">{output}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
