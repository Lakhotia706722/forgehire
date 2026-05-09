'use client';

import * as React from 'react';
import { PreAssessment } from './_components/pre-assessment';
import { AssessmentTopbar } from './_components/assessment-topbar';
import { MCQSection } from './_components/mcq-section';
import { CodingSection } from './_components/coding-section';
import { ScenarioSection } from './_components/scenario-section';
import { TabSwitchWarning, InactivityWarning, CopyPasteToast } from './_components/anti-cheat-overlays';
import { AssessmentReport } from './_components/assessment-report';
import {
  MOCK_MCQ, MOCK_CODING_TASKS,
  type AssessmentSection, type MCQQuestion, type CodingTask,
} from './_components/assessment-store';

const TOTAL_SECONDS = 90 * 60; // 90 minutes
const INACTIVITY_TIMEOUT = 5 * 60; // 5 minutes

type Phase = 'pre' | 'active' | 'submitting' | 'report';

export default function AssessmentPage() {
  const [phase, setPhase] = React.useState<Phase>('pre');
  const [section, setSection] = React.useState<AssessmentSection>('mcq');
  const [secondsLeft, setSecondsLeft] = React.useState(TOTAL_SECONDS);
  const [mcqQuestions, setMcqQuestions] = React.useState<MCQQuestion[]>(MOCK_MCQ);
  const [currentMCQ, setCurrentMCQ] = React.useState(0);
  const [codingTasks, setCodingTasks] = React.useState<CodingTask[]>(MOCK_CODING_TASKS);
  const [currentCodingTask, setCurrentCodingTask] = React.useState(0);
  const [scenarioText, setScenarioText] = React.useState('');
  const [tabSwitchCount, setTabSwitchCount] = React.useState(0);
  const [showTabWarning, setShowTabWarning] = React.useState(false);
  const [showInactivity, setShowInactivity] = React.useState(false);
  const [inactivityLeft, setInactivityLeft] = React.useState(120);
  const [showCopyToast, setShowCopyToast] = React.useState(false);

  const timerRef = React.useRef<ReturnType<typeof setInterval>>();
  const inactivityRef = React.useRef<ReturnType<typeof setTimeout>>();
  const inactivityTimerRef = React.useRef<ReturnType<typeof setInterval>>();
  const lastActivityRef = React.useRef(Date.now());

  // ── Countdown timer ──────────────────────────────────────────
  React.useEffect(() => {
    if (phase !== 'active') return;

    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [phase]);

  // ── Tab visibility detection ──────────────────────────────────
  React.useEffect(() => {
    if (phase !== 'active') return;

    function handleVisibilityChange() {
      if (document.hidden) {
        setTabSwitchCount((c) => {
          const newCount = c + 1;
          setShowTabWarning(true);
          if (newCount >= 3) handleSubmit();
          return newCount;
        });
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [phase]);

  // ── Copy-paste prevention ─────────────────────────────────────
  React.useEffect(() => {
    if (phase !== 'active') return;

    function handleCopy(e: ClipboardEvent) {
      e.preventDefault();
      setShowCopyToast(true);
      setTimeout(() => setShowCopyToast(false), 3000);
    }
    function handlePaste(e: ClipboardEvent) {
      // Allow paste in Monaco editor (it handles its own events)
      const target = e.target as HTMLElement;
      if (target.closest('[data-testid="monaco-editor-container"]')) return;
      e.preventDefault();
      setShowCopyToast(true);
      setTimeout(() => setShowCopyToast(false), 3000);
    }

    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
    };
  }, [phase]);

  // ── Inactivity detection ──────────────────────────────────────
  React.useEffect(() => {
    if (phase !== 'active') return;

    function resetInactivity() {
      lastActivityRef.current = Date.now();
      if (showInactivity) {
        setShowInactivity(false);
        clearInterval(inactivityTimerRef.current);
      }
      clearTimeout(inactivityRef.current);
      inactivityRef.current = setTimeout(() => {
        setShowInactivity(true);
        setInactivityLeft(120);
        inactivityTimerRef.current = setInterval(() => {
          setInactivityLeft((prev) => {
            if (prev <= 1) {
              clearInterval(inactivityTimerRef.current);
              handleSubmit();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }, INACTIVITY_TIMEOUT * 1000);
    }

    const events = ['mousemove', 'keydown', 'click', 'scroll'];
    events.forEach((e) => document.addEventListener(e, resetInactivity));
    resetInactivity();

    return () => {
      events.forEach((e) => document.removeEventListener(e, resetInactivity));
      clearTimeout(inactivityRef.current);
      clearInterval(inactivityTimerRef.current);
    };
  }, [phase, showInactivity]);

  // ── Assessment keyboard shortcuts ────────────────────────────
  // Enter = select highlighted MCQ option, Alt+N = next, Alt+P = previous
  React.useEffect(() => {
    if (phase !== 'active' || section !== 'mcq') return;

    function handleKey(e: KeyboardEvent) {
      // Alt+N — next question
      if (e.altKey && e.key === 'n') {
        e.preventDefault();
        setCurrentMCQ((i) => Math.min(i + 1, mcqQuestions.length - 1));
        return;
      }
      // Alt+P — previous question
      if (e.altKey && e.key === 'p') {
        e.preventDefault();
        setCurrentMCQ((i) => Math.max(i - 1, 0));
        return;
      }
      // 1-4 / A-D — select MCQ option by number or letter
      const optionMap: Record<string, number> = {
        '1': 0, '2': 1, '3': 2, '4': 3,
        'a': 0, 'b': 1, 'c': 2, 'd': 3,
      };
      const optionIndex = optionMap[e.key.toLowerCase()];
      if (optionIndex !== undefined && !e.altKey && !e.ctrlKey && !e.metaKey) {
        const q = mcqQuestions[currentMCQ];
        if (q && optionIndex < q.options.length) {
          handleAnswer(q.id, optionIndex);
        }
        return;
      }
      // Enter — advance to next question after answering
      if (e.key === 'Enter' && !e.altKey && !e.ctrlKey && !e.metaKey) {
        const q = mcqQuestions[currentMCQ];
        if (q?.selectedOption !== undefined) {
          setCurrentMCQ((i) => Math.min(i + 1, mcqQuestions.length - 1));
        }
      }
    }

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [phase, section, currentMCQ, mcqQuestions]);

  function handleBegin() {
    setPhase('active');
    // Request fullscreen
    document.documentElement.requestFullscreen?.().catch(() => {});
  }

  function handleSubmit() {
    clearInterval(timerRef.current);
    setPhase('submitting');
    // Simulate report generation (2s)
    setTimeout(() => setPhase('report'), 2000);
  }

  function handleAnswer(questionId: string, optionIndex: number) {
    setMcqQuestions((prev) =>
      prev.map((q) => q.id === questionId ? { ...q, selectedOption: optionIndex } : q)
    );
  }

  function handleFlag(questionId: string) {
    setMcqQuestions((prev) =>
      prev.map((q) => q.id === questionId ? { ...q, flagged: !q.flagged } : q)
    );
  }

  function handleCodeChange(taskId: string, code: string) {
    setCodingTasks((prev) =>
      prev.map((t) => t.id === taskId ? { ...t, code } : t)
    );
  }

  function handleRunCode(taskId: string) {
    setCodingTasks((prev) =>
      prev.map((t) => t.id === taskId ? { ...t, running: true, output: '' } : t)
    );
    // Simulate code execution
    setTimeout(() => {
      setCodingTasks((prev) =>
        prev.map((t) => t.id === taskId ? {
          ...t,
          running: false,
          output: '✓ Test case 1 passed\n✓ Test case 2 passed\n✗ Test case 3 failed: Expected [1, 2] but got [2, 1]\n\nPassed: 2/3 test cases',
        } : t)
      );
    }, 1500);
  }

  // ── Render ────────────────────────────────────────────────────
  if (phase === 'pre') {
    return <PreAssessment onBegin={handleBegin} />;
  }

  if (phase === 'submitting') {
    return (
      <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center gap-6">
        <NeuronScoreSpinner />
        <div className="text-center">
          <p className="font-display text-xl font-bold text-text-primary mb-2">
            Generating your assessment report...
          </p>
          <p className="text-text-secondary text-sm">
            Analysing your responses across all dimensions
            <span className="inline-flex gap-0.5 ml-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1 h-1 rounded-full bg-accent-cyan animate-pulse"
                  style={{ animationDelay: `${i * 200}ms` }}
                />
              ))}
            </span>
          </p>
        </div>
      </div>
    );
  }

  if (phase === 'report') {
    return <AssessmentReport />;
  }

  // Active assessment
  return (
    <div className="flex flex-col h-screen bg-bg-base overflow-hidden">
      <AssessmentTopbar
        section={section}
        secondsLeft={secondsLeft}
        tabSwitchCount={tabSwitchCount}
      />

      {/* Section content — below fixed topbar */}
      <div className="flex-1 overflow-hidden mt-14">
        {section === 'mcq' && (
          <MCQSection
            questions={mcqQuestions}
            currentIndex={currentMCQ}
            onAnswer={handleAnswer}
            onFlag={handleFlag}
            onNavigate={setCurrentMCQ}
          />
        )}
        {section === 'coding' && (
          <CodingSection
            tasks={codingTasks}
            currentTask={currentCodingTask}
            onCodeChange={handleCodeChange}
            onRunCode={handleRunCode}
            onTaskChange={setCurrentCodingTask}
          />
        )}
        {section === 'scenario' && (
          <ScenarioSection text={scenarioText} onChange={setScenarioText} />
        )}
      </div>

      {/* Section navigation */}
      <div className="border-t border-[rgba(255,255,255,0.06)] bg-bg-surface px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            {(['mcq', 'coding', 'scenario'] as AssessmentSection[]).map((s) => (
              <button
                key={s}
                onClick={() => setSection(s)}
                className={`text-xs px-3 py-1.5 rounded-lg font-mono transition-all ${
                  section === s
                    ? 'bg-accent-cyan text-bg-base font-semibold'
                    : 'text-text-muted hover:text-text-secondary border border-[rgba(255,255,255,0.08)]'
                }`}
              >
                {s.toUpperCase()}
              </button>
            ))}
          </div>
          {/* Keyboard shortcut hints — MCQ only */}
          {section === 'mcq' && (
            <div className="hidden sm:flex items-center gap-3 text-[10px] text-text-muted font-mono" aria-label="Keyboard shortcuts">
              <span><kbd className="px-1 py-0.5 rounded bg-[rgba(255,255,255,0.06)]">1–4</kbd> select option</span>
              <span><kbd className="px-1 py-0.5 rounded bg-[rgba(255,255,255,0.06)]">↵</kbd> next</span>
              <span><kbd className="px-1 py-0.5 rounded bg-[rgba(255,255,255,0.06)]">Alt+N</kbd> / <kbd className="px-1 py-0.5 rounded bg-[rgba(255,255,255,0.06)]">Alt+P</kbd> navigate</span>
            </div>
          )}
        </div>
        <button
          onClick={handleSubmit}
          className="text-xs px-4 py-2 rounded-lg bg-accent-red text-white font-medium hover:brightness-110 transition-all"
        >
          Submit Assessment
        </button>
      </div>

      {/* Anti-cheat overlays */}
      {showTabWarning && (
        <TabSwitchWarning
          count={tabSwitchCount}
          onReturn={() => setShowTabWarning(false)}
        />
      )}
      {showInactivity && (
        <InactivityWarning
          secondsLeft={inactivityLeft}
          onDismiss={() => {
            setShowInactivity(false);
            clearInterval(inactivityTimerRef.current);
          }}
        />
      )}
      {showCopyToast && <CopyPasteToast />}
    </div>
  );
}

function NeuronScoreSpinner() {
  return (
    <div className="relative w-24 h-24">
      <svg className="w-24 h-24 animate-spin" viewBox="0 0 96 96" aria-hidden="true">
        <circle cx="48" cy="48" r="40" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6"/>
        <circle
          cx="48" cy="48" r="40"
          fill="none" stroke="#00D4FF" strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray="251"
          strokeDashoffset="188"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-8 h-8 rounded-lg bg-accent-cyan flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" stroke="#080B14" strokeWidth="1.5" strokeLinejoin="round"/>
            <circle cx="8" cy="8" r="2" fill="#080B14"/>
          </svg>
        </div>
      </div>
    </div>
  );
}
