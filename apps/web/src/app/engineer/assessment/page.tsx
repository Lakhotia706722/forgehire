'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { PreAssessment } from './_components/pre-assessment';
import { AssessmentTopbar } from './_components/assessment-topbar';
import { MCQSection } from './_components/mcq-section';
import { CodingSection } from './_components/coding-section';
import { ScenarioSection } from './_components/scenario-section';
import { TabSwitchWarning, InactivityWarning, CopyPasteToast } from './_components/anti-cheat-overlays';
import { apiFetch } from '@/lib/api-fetch';
import { useProctoring } from '@/hooks/use-proctoring';
import type { AssessmentSection, MCQQuestion, CodingTask } from './_components/assessment-store';

const TOTAL_SECONDS = 90 * 60; // 90 minutes
type Phase = 'pre' | 'active' | 'submitting';
type AssessmentGenerateResponse = {
  assessmentId: string;
  questions: Array<{
    id: string;
    question: string;
    options: string[];
  }>;
  codingTasks: Array<{
    id: string;
    title: string;
    description: string;
    starterCode?: string;
    testCases?: Array<{ input: unknown; expectedOutput: unknown }>;
  }>;
};

export default function AssessmentPage() {
  const router = useRouter();
  const [phase, setPhase] = React.useState<Phase>('pre');
  const [assessmentId, setAssessmentId] = React.useState<string | null>(null);
  const [section, setSection] = React.useState<AssessmentSection>('mcq');
  const [secondsLeft, setSecondsLeft] = React.useState(TOTAL_SECONDS);
  const [mcqQuestions, setMcqQuestions] = React.useState<MCQQuestion[]>([]);
  const [currentMCQ, setCurrentMCQ] = React.useState(0);
  const [codingTasks, setCodingTasks] = React.useState<CodingTask[]>([]);
  const [codingTaskCases, setCodingTaskCases] = React.useState<
    Record<string, Array<{ input: unknown; expectedOutput: unknown }>>
  >({});
  const [currentCodingTask, setCurrentCodingTask] = React.useState(0);
  const [scenarioText, setScenarioText] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showCopyToast, setShowCopyToast] = React.useState(false);

  const timerRef = React.useRef<ReturnType<typeof setInterval>>();

  const handleSubmit = React.useCallback(async (autoSubmitted = false) => {
    if (!assessmentId) return;
    clearInterval(timerRef.current);
    setPhase('submitting');
    try {
      await apiFetch(`/api/assessment/${assessmentId}/submit`, {
        method: 'POST',
        body: JSON.stringify({
          mcqResponses: mcqQuestions.map((q) => q.selectedOption),
          codingSubmissions: codingTasks.map((t) => ({ id: t.id, code: t.code })),
          caseResponse: scenarioText,
          autoSubmitted,
        }),
      });
      router.push(`/engineer/assessment/result?id=${assessmentId}`);
    } catch {
      router.push(`/engineer/assessment/result?id=${assessmentId}`);
    }
  }, [assessmentId, mcqQuestions, codingTasks, scenarioText, router]);

  const proctor = useProctoring({
    assessmentId,
    enabled: phase === 'active',
    onForceSubmit: () => {
      void handleSubmit(true);
    },
  });

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
  }, [phase, handleSubmit]);

  // ── Copy/paste toast feedback ─────────────────────────────────
  React.useEffect(() => {
    if (phase !== 'active') return;

    function handleCopy(e: ClipboardEvent) {
      e.preventDefault();
      setShowCopyToast(true);
      setTimeout(() => setShowCopyToast(false), 3000);
    }
    function handlePaste(e: ClipboardEvent) {
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

  async function handleBegin() {
    setLoading(true);
    setError(null);
    try {
      const generated = await apiFetch<AssessmentGenerateResponse>('/api/assessment/generate', {
        method: 'POST',
      });
      setAssessmentId(generated.assessmentId);
      await apiFetch(`/api/assessment/${generated.assessmentId}/start`, {
        method: 'POST',
      });
      setMcqQuestions(
        generated.questions.map((q, i) => ({
          id: q.id,
          number: i + 1,
          text: q.question,
          options: q.options,
          selectedOption: null,
          flagged: false,
        })),
      );
      setCodingTasks(
        generated.codingTasks.map((task) => ({
          id: task.id,
          title: task.title,
          description: task.description,
          examples: [],
          constraints: [],
          code: task.starterCode ?? '',
          output: '',
          running: false,
        })),
      );
      setCodingTaskCases(
        generated.codingTasks.reduce<Record<string, Array<{ input: unknown; expectedOutput: unknown }>>>(
          (acc, task) => {
            acc[task.id] = task.testCases ?? [];
            return acc;
          },
          {},
        ),
      );
      setPhase('active');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start assessment');
    } finally {
      setLoading(false);
    }
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

  async function handleRunCode(taskId: string) {
    if (!assessmentId) return;
    const task = codingTasks.find((t) => t.id === taskId);
    if (!task) return;
    setCodingTasks((prev) =>
      prev.map((t) => t.id === taskId ? { ...t, running: true, output: '' } : t)
    );
    try {
      const result = await apiFetch<{
        stdout: string;
        stderr: string;
        passed: Array<{ testCase: number }>;
        failed: Array<{ testCase: number; error?: string }>;
      }>('/api/assessment/run-code', {
        method: 'POST',
        body: JSON.stringify({
          code: task.code,
          language: 'python',
          testCases: (codingTaskCases[task.id] ?? []).map((tc) => ({
            input: tc.input,
            expectedOutput: tc.expectedOutput,
            hidden: false,
          })),
        }),
      });
      const output = [
        result.stdout,
        result.stderr,
        `Passed: ${result.passed.length}, Failed: ${result.failed.length}`,
      ]
        .filter(Boolean)
        .join('\n');
      setCodingTasks((prev) =>
        prev.map((t) => t.id === taskId ? {
          ...t,
          running: false,
          output,
        } : t)
      );
    } catch (e) {
      setCodingTasks((prev) =>
        prev.map((t) => t.id === taskId ? {
          ...t,
          running: false,
          output: e instanceof Error ? e.message : 'Run failed',
        } : t)
      );
    }
  }

  // ── Render ────────────────────────────────────────────────────
  if (phase === 'pre') {
    return (
      <div>
        <PreAssessment onBegin={() => { void handleBegin(); }} />
        {loading && <p className="text-center text-xs text-text-muted -mt-8 pb-8">Generating your assessment...</p>}
        {error && <p className="text-center text-xs text-accent-red -mt-8 pb-8">{error}</p>}
      </div>
    );
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

  // Active assessment
  return (
    <div className="flex flex-col h-screen bg-bg-base overflow-hidden">
      <AssessmentTopbar
        section={section}
        secondsLeft={secondsLeft}
        tabSwitchCount={proctor.tabSwitchCount}
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
          onClick={() => {
            void handleSubmit();
          }}
          className="text-xs px-4 py-2 rounded-lg bg-accent-red text-white font-medium hover:brightness-110 transition-all"
        >
          Submit Assessment
        </button>
      </div>

      {/* Anti-cheat overlays */}
      {proctor.showTabWarning && (
        <TabSwitchWarning
          count={proctor.tabSwitchCount}
          onReturn={proctor.acknowledgeTabWarning}
        />
      )}
      {proctor.showInactivityWarning && (
        <InactivityWarning
          secondsLeft={proctor.inactivityCountdown}
          onDismiss={proctor.dismissInactivityWarning}
        />
      )}
      {showCopyToast && <CopyPasteToast />}
      {proctor.showFullscreenOverlay && (
        <div className="fixed inset-0 z-[120] bg-black/75 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-bg-elevated border border-[rgba(255,255,255,0.15)] rounded-xl p-6 max-w-md text-center">
            <p className="text-text-primary font-semibold mb-2">Fullscreen required</p>
            <p className="text-text-secondary text-sm mb-4">
              Re-enter fullscreen to continue the assessment.
            </p>
            <button
              className="px-4 py-2 rounded bg-accent-cyan text-bg-base text-sm font-medium"
              onClick={() => {
                document.documentElement.requestFullscreen?.().catch(() => {});
              }}
            >
              Enter Fullscreen
            </button>
          </div>
        </div>
      )}
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
