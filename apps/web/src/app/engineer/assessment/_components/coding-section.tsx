'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { CodingTask } from './assessment-store';

// SSR-safe Monaco import — critical: ssr: false prevents server-side crash
const MonacoEditor = dynamic(
  () => import('@monaco-editor/react').then((m) => m.default),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center bg-bg-base">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-accent-cyan border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-text-muted font-mono">Loading editor...</p>
        </div>
      </div>
    ),
  }
);

// Custom Monaco theme matching NeuronHire design system
const MONACO_THEME = {
  base: 'vs-dark' as const,
  inherit: true,
  rules: [
    { token: 'comment',    foreground: '4A5568', fontStyle: 'italic' },
    { token: 'keyword',    foreground: '00D4FF' },
    { token: 'string',     foreground: '10B981' },
    { token: 'number',     foreground: 'F59E0B' },
    { token: 'type',       foreground: '7B5EA7' },
    { token: 'function',   foreground: '00D4FF' },
    { token: 'variable',   foreground: 'F0F4FF' },
    { token: 'operator',   foreground: '8892A4' },
  ],
  colors: {
    'editor.background':           '#080B14',
    'editor.foreground':           '#F0F4FF',
    'editor.lineHighlightBackground': '#0E1220',
    'editorLineNumber.foreground': '#4A5568',
    'editorCursor.foreground':     '#00D4FF',
    'editor.selectionBackground':  '#00D4FF30',
    'editorIndentGuide.background':'#141828',
    'editorWidget.background':     '#0E1220',
    'editorSuggestWidget.background': '#0E1220',
    'editorSuggestWidget.border':  '#141828',
  },
};

interface CodingSectionProps {
  tasks: CodingTask[];
  currentTask: number;
  onCodeChange: (taskId: string, code: string) => void;
  onRunCode: (taskId: string) => void;
  onTaskChange: (index: number) => void;
}

export function CodingSection({
  tasks, currentTask, onCodeChange, onRunCode, onTaskChange,
}: CodingSectionProps) {
  const task = tasks[currentTask];
  const [splitPos, setSplitPos] = React.useState(35); // % for left panel
  const dragging = React.useRef(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  function handleMouseDown() { dragging.current = true; }

  React.useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!dragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
      setSplitPos(Math.max(25, Math.min(60, pct)));
    }
    function onUp() { dragging.current = false; }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, []);

  function handleEditorMount(editor: any, monaco: any) {
    monaco.editor.defineTheme('neuronhire', MONACO_THEME);
    monaco.editor.setTheme('neuronhire');
  }

  return (
    <div className="flex flex-col h-full">
      {/* Task tabs */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-[rgba(255,255,255,0.06)] bg-bg-surface">
        {tasks.map((t, i) => (
          <button
            key={t.id}
            onClick={() => onTaskChange(i)}
            className={cn(
              'px-4 py-1.5 rounded-lg text-xs font-mono transition-all',
              currentTask === i
                ? 'bg-accent-cyan text-bg-base font-semibold'
                : 'text-text-muted hover:text-text-secondary'
            )}
            aria-selected={currentTask === i}
            role="tab"
          >
            Task {i + 1}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-text-muted font-mono">Python 3.11</span>
        </div>
      </div>

      {/* Split panel */}
      <div ref={containerRef} className="flex flex-1 overflow-hidden" style={{ minHeight: 0 }}>
        {/* Left: task description */}
        <div
          className="flex flex-col overflow-y-auto border-r border-[rgba(255,255,255,0.06)] bg-bg-surface"
          style={{ width: `${splitPos}%` }}
        >
          <div className="p-5 space-y-4">
            <h3 className="font-display font-semibold text-text-primary text-sm">{task.title}</h3>
            <p className="text-text-secondary text-xs leading-relaxed whitespace-pre-wrap">{task.description}</p>

            {task.examples.length > 0 && (
              <div>
                <p className="text-xs font-mono text-text-muted uppercase tracking-wider mb-2">Examples</p>
                {task.examples.map((ex, i) => (
                  <div key={i} className="bg-bg-elevated rounded-lg p-3 space-y-1.5 mb-2">
                    <div>
                      <span className="text-[10px] text-text-muted font-mono">Input:</span>
                      <pre className="text-xs text-accent-cyan font-mono mt-0.5 whitespace-pre-wrap">{ex.input}</pre>
                    </div>
                    <div>
                      <span className="text-[10px] text-text-muted font-mono">Output:</span>
                      <pre className="text-xs text-accent-green font-mono mt-0.5 whitespace-pre-wrap">{ex.output}</pre>
                    </div>
                    {ex.explanation && (
                      <p className="text-[10px] text-text-muted">{ex.explanation}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {task.constraints.length > 0 && (
              <div>
                <p className="text-xs font-mono text-text-muted uppercase tracking-wider mb-2">Constraints</p>
                <ul className="space-y-1">
                  {task.constraints.map((c, i) => (
                    <li key={i} className="text-xs text-text-secondary flex items-start gap-1.5">
                      <span className="text-accent-cyan mt-0.5" aria-hidden="true">·</span>
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Drag handle */}
        <div
          className="w-1 bg-[rgba(255,255,255,0.04)] hover:bg-accent-cyan cursor-col-resize transition-colors shrink-0"
          onMouseDown={handleMouseDown}
          role="separator"
          aria-label="Resize panels"
        />

        {/* Right: editor + console */}
        <div className="flex flex-col flex-1 overflow-hidden" style={{ minWidth: 0 }}>
          {/* Editor */}
          <div className="flex-1 overflow-hidden" data-testid="monaco-editor-container">
            <MonacoEditor
              height="100%"
              language="python"
              value={task.code}
              onChange={(val) => onCodeChange(task.id, val ?? '')}
              onMount={handleEditorMount}
              options={{
                fontSize: 13,
                fontFamily: '"JetBrains Mono", monospace',
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                lineNumbers: 'on',
                renderLineHighlight: 'line',
                tabSize: 4,
                wordWrap: 'on',
                padding: { top: 12, bottom: 12 },
                smoothScrolling: true,
                cursorBlinking: 'smooth',
                contextmenu: false, // disable right-click (anti-cheat)
              }}
            />
          </div>

          {/* Console */}
          <div className="h-36 border-t border-[rgba(255,255,255,0.06)] bg-bg-base flex flex-col">
            <div className="flex items-center justify-between px-4 py-2 border-b border-[rgba(255,255,255,0.06)]">
              <span className="text-xs font-mono text-text-muted">Output Console</span>
              <Button
                size="sm"
                onClick={() => onRunCode(task.id)}
                loading={task.running}
                className="h-7 text-xs"
              >
                ▶ Run Code
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-2">
              {task.output ? (
                <pre className="text-xs font-mono text-accent-green whitespace-pre-wrap">{task.output}</pre>
              ) : (
                <p className="text-xs text-text-muted font-mono">Click &quot;Run Code&quot; to see output</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
