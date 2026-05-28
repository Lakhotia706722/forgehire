'use client';

import * as React from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { AriaRadio } from '@/components/ui/aria-tab-button';
import { apiFetch, ApiRequestError } from '@/lib/api-fetch';

const MINI_GATE_SECONDS = 15 * 60; // 15 minutes

interface GateQuestion {
  id: string;
  number: number;
  text: string;
  options: string[];
  correctAnswer?: number;
  selectedOption: number | null;
}

interface GateQuestionResponse {
  testId: string;
  questions: GateQuestion[];
}

interface MiniGateModalProps {
  open: boolean;
  onClose: () => void;
  onPass: () => void;
  requiredScore: number;
  taskId: string;
}

export function MiniGateModal({ open, onClose, onPass, requiredScore, taskId }: MiniGateModalProps) {
  const [phase, setPhase] = React.useState<'intro' | 'loading' | 'test' | 'result'>('intro');
  const [secondsLeft, setSecondsLeft] = React.useState(MINI_GATE_SECONDS);
  const [questions, setQuestions] = React.useState<GateQuestion[]>([]);
  const [testId, setTestId] = React.useState<string | null>(null);
  const [fetchError, setFetchError] = React.useState<string | null>(null);
  const [currentQ, setCurrentQ] = React.useState(0);
  const [passed, setPassed] = React.useState(false);
  const timerRef = React.useRef<ReturnType<typeof setInterval>>();

  async function loadQuestions() {
    setPhase('loading');
    setFetchError(null);
    try {
      const res = await apiFetch<GateQuestionResponse>(`/api/tasks/${taskId}/gate-questions`);
      const qs: GateQuestion[] = res.questions.map((q) => ({
        ...q,
        selectedOption: null,
      }));
      setTestId(res.testId);
      setQuestions(qs);
      setCurrentQ(0);
      setSecondsLeft(MINI_GATE_SECONDS);
      setPhase('test');
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 409) {
        setFetchError(err.message);
      } else {
        setFetchError(err instanceof Error ? err.message : 'Failed to load questions');
      }
      setPhase('intro');
    }
  }

  // Timer — uses document.hidden to detect tab switches (doesn't pause)
  React.useEffect(() => {
    if (phase !== 'test') return;

    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          void handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  function handleAnswer(optionIndex: number) {
    setQuestions((prev) =>
      prev.map((q, i) => i === currentQ ? { ...q, selectedOption: optionIndex } : q)
    );
    if (currentQ < questions.length - 1) {
      setTimeout(() => setCurrentQ((c) => c + 1), 300);
    }
  }

  async function handleSubmit() {
    clearInterval(timerRef.current);
    if (!testId) {
      setPassed(false);
      setPhase('result');
      return;
    }

    try {
      const result = await apiFetch<{ passed: boolean }>(`/api/tasks/${taskId}/gate-submit`, {
        method: 'POST',
        body: JSON.stringify({
          testId,
          answers: questions
            .filter((q) => q.selectedOption !== null)
            .map((q) => ({ questionId: q.id, selectedOption: q.selectedOption })),
        }),
      });
      setPassed(Boolean(result.passed));
      setPhase('result');
      if (result.passed) {
        setTimeout(onPass, 1500);
      }
    } catch {
      setPassed(false);
      setPhase('result');
    }
  }

  function formatTime(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }

  const q = questions[currentQ];
  const answeredCount = questions.filter((q) => q.selectedOption !== null).length;
  const isRed = secondsLeft <= 2 * 60;

  return (
    <Modal
      open={open}
      onClose={phase === 'test' ? undefined : onClose}
      title={phase === 'intro' || phase === 'loading' ? 'Mini-Gate Test' : undefined}
      size="lg"
    >
      {(phase === 'intro' || phase === 'loading') && (
        <div className="p-6 space-y-5">
          <div className="bg-[rgba(245,158,11,0.06)] border border-[rgba(245,158,11,0.2)] rounded-xl p-4">
            <p className="text-sm font-medium text-accent-amber mb-1">Score {requiredScore}+ required</p>
            <p className="text-xs text-text-secondary">
              Your current NeuronScore is below the minimum for this bounty. Pass this 15-minute domain test to unlock participation.
            </p>
          </div>

          {fetchError && (
            <div className="bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.25)] rounded-xl p-3 text-xs text-red-400">
              {fetchError}
            </div>
          )}

          {phase === 'loading' ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <p className="text-xs text-text-muted text-center">Loading questions…</p>
            </div>
          ) : (
            <div className="space-y-2">
              {[
                '10 multiple-choice questions',
                '15 minutes — timer starts immediately',
                'Score 60%+ to pass',
                'Timer continues even if you switch tabs',
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-text-secondary">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#00D4FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M2 8l4 4 8-8"/>
                  </svg>
                  {item}
                </div>
              ))}
            </div>
          )}

          {phase === 'intro' && (
            <div className="flex gap-3">
              <Button
                size="md"
                className="flex-1"
                onClick={loadQuestions}
                data-testid="mini-gate-start-btn"
              >
                Start Test
              </Button>
              <Button variant="ghost" size="md" onClick={onClose}>Cancel</Button>
            </div>
          )}
        </div>
      )}

      {phase === 'test' && q && (
        <div className="flex flex-col min-h-[480px]">
          {/* Test header */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-[rgba(255,255,255,0.06)] bg-bg-elevated">
            <span className="text-xs font-mono text-text-muted">
              Question {currentQ + 1} / {questions.length} · {answeredCount} answered
            </span>
            <span
              className={cn(
                'font-mono font-bold text-lg tabular-nums',
                isRed ? 'text-accent-red animate-pulse' : 'text-text-primary'
              )}
              data-testid="mini-gate-timer"
              aria-live="polite"
              aria-label={`Time remaining: ${formatTime(secondsLeft)}`}
            >
              {formatTime(secondsLeft)}
            </span>
          </div>

          {/* Question */}
          <div className="flex-1 p-6 space-y-4">
            <p className="text-text-primary text-sm font-medium leading-relaxed">{q.text}</p>
            <div className="space-y-2.5" role="radiogroup" aria-label="Answer options">
              {q.options.map((opt, i) => (
                <AriaRadio
                  key={i}
                  checked={q.selectedOption === i}
                  onClick={() => handleAnswer(i)}
                  className={cn(
                    'w-full text-left px-4 py-3 rounded-xl border text-sm transition-all duration-150',
                    q.selectedOption === i
                      ? 'border-[rgba(0,212,255,0.5)] bg-[rgba(0,212,255,0.06)] text-text-primary border-l-4 border-l-accent-cyan'
                      : 'border-[rgba(255,255,255,0.06)] text-text-secondary hover:border-[rgba(255,255,255,0.15)]'
                  )}
                >
                  {opt}
                </AriaRadio>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-[rgba(255,255,255,0.06)]">
            <button
              onClick={() => setCurrentQ((c) => Math.max(0, c - 1))}
              disabled={currentQ === 0}
              className="text-sm text-text-muted hover:text-text-secondary disabled:opacity-30 transition-colors"
            >
              ← Previous
            </button>
            {currentQ === questions.length - 1 ? (
              <Button size="sm" onClick={() => { void handleSubmit(); }} data-testid="mini-gate-submit-btn">
                Submit
              </Button>
            ) : (
              <button
                onClick={() => setCurrentQ((c) => Math.min(questions.length - 1, c + 1))}
                className="text-sm text-text-muted hover:text-text-secondary transition-colors"
              >
                Next →
              </button>
            )}
          </div>
        </div>
      )}

      {phase === 'result' && (
        <div className="flex flex-col items-center justify-center py-12 gap-4 px-6">
          <div
            className={cn(
              'w-16 h-16 rounded-full flex items-center justify-center',
              passed
                ? 'bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.3)]'
                : 'bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)]'
            )}
          >
            {passed ? (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
            ) : (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            )}
          </div>
          <p className={cn('font-display font-bold text-xl', passed ? 'text-accent-green' : 'text-accent-red')}>
            {passed ? 'Test Passed!' : 'Test Failed'}
          </p>
          <p className="text-text-secondary text-sm text-center">
            {passed
              ? 'You can now participate in this bounty.'
              : 'You need 60%+ to pass. You can retake this test in 24 hours.'}
          </p>
          {!passed && (
            <Button variant="secondary" size="md" onClick={onClose}>Close</Button>
          )}
        </div>
      )}
    </Modal>
  );
}
