'use client';

import * as React from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AriaCheckbox } from '@/components/ui/aria-tab-button';

interface NDAModalProps {
  open: boolean;
  onClose: () => void;
  onSigned: (signature: string) => Promise<void> | void;
  taskTitle: string;
}

export function NDAModal({ open, onClose, onSigned, taskTitle }: NDAModalProps) {
  const [agreed, setAgreed] = React.useState(false);
  const [signed, setSigned] = React.useState(false);
  const [signMode, setSignMode] = React.useState<'draw' | 'type'>('type');
  const [typedSig, setTypedSig] = React.useState('');
  const [confirmed, setConfirmed] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const drawing = React.useRef(false);

  // Canvas drawing
  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    drawing.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.lineTo(x, y);
    ctx.strokeStyle = '#00D4FF';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();
    setSigned(true);
  }

  function stopDraw() { drawing.current = false; }

  function clearCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    setSigned(false);
  }

  async function handleSign() {
    const hasSignature = signMode === 'draw' ? signed : typedSig.trim().length > 0;
    if (!hasSignature || !agreed) return;

    const signature = signMode === 'draw'
      ? canvasRef.current?.toDataURL('image/png') ?? ''
      : typedSig.trim();
    if (!signature) return;

    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const result = onSigned(signature);
      if (result && typeof (result as Promise<void>).then === 'function') {
        await result;
      }
      setConfirmed(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to sign NDA');
    } finally {
      setIsSubmitting(false);
    }
  }

  const canSign = agreed && (signMode === 'draw' ? signed : typedSig.trim().length > 0);

  return (
    <Modal open={open} onClose={onClose} title="Non-Disclosure Agreement" size="lg">
      {confirmed ? (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <div className="w-16 h-16 rounded-full bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.3)] flex items-center justify-center animate-fade-up">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
          </div>
          <p className="font-display font-semibold text-text-primary text-lg">NDA Signed Successfully</p>
          <p className="text-text-secondary text-sm">You can now access full task details.</p>
        </div>
      ) : (
        <div className="p-6 space-y-5">
          {/* NDA document preview */}
          <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl p-5 max-h-64 overflow-y-auto text-xs text-text-secondary leading-relaxed space-y-3">
            <p className="font-semibold text-text-primary text-sm">NON-DISCLOSURE AGREEMENT</p>
            <p>This Non-Disclosure Agreement (&quot;Agreement&quot;) is entered into between the Company and the Engineer participating in the task titled: <strong className="text-text-primary">&quot;{taskTitle}&quot;</strong>.</p>
            <p><strong className="text-text-primary">1. Confidential Information.</strong> The Engineer agrees to keep all information shared by the Company in connection with this task strictly confidential, including but not limited to technical specifications, business data, customer information, and proprietary algorithms.</p>
            <p><strong className="text-text-primary">2. Non-Disclosure.</strong> The Engineer shall not disclose, publish, or otherwise reveal any Confidential Information to any third party without prior written consent from the Company.</p>
            <p><strong className="text-text-primary">3. Duration.</strong> This Agreement shall remain in effect for a period of 2 years from the date of signing.</p>
            <p><strong className="text-text-primary">4. Remedies.</strong> The Engineer acknowledges that breach of this Agreement may cause irreparable harm and agrees that the Company shall be entitled to seek injunctive relief in addition to other remedies.</p>
            <p><strong className="text-text-primary">5. Governing Law.</strong> This Agreement shall be governed by the laws of India.</p>
          </div>

          {/* Agreement checkbox */}
          <label className="flex items-start gap-3 cursor-pointer">
            <AriaCheckbox
              checked={agreed}
              onClick={() => setAgreed((a) => !a)}
              onKeyDown={(e) => e.key === 'Enter' && setAgreed((a) => !a)}
              className={cn(
                'w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all',
                agreed ? 'bg-accent-cyan border-accent-cyan' : 'border-[rgba(255,255,255,0.2)]'
              )}
            >
              {agreed && (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
                  <path d="M1 4L3.5 6.5L9 1" stroke="#080B14" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </AriaCheckbox>
            <span className="text-sm text-text-secondary">
              I have read and agree to the terms of this Non-Disclosure Agreement
            </span>
          </label>

          {/* Signature */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <p className="text-sm font-medium text-text-secondary">E-Signature</p>
              <div className="flex gap-1">
                {(['type', 'draw'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => { setSignMode(m); setSigned(false); setTypedSig(''); }}
                    className={cn(
                      'text-xs px-2.5 py-1 rounded-lg transition-all',
                      signMode === m
                        ? 'bg-accent-cyan text-bg-base font-semibold'
                        : 'text-text-muted border border-[rgba(255,255,255,0.08)] hover:text-text-secondary'
                    )}
                  >
                    {m === 'type' ? 'Type' : 'Draw'}
                  </button>
                ))}
              </div>
            </div>

            {signMode === 'type' ? (
              <input
                type="text"
                value={typedSig}
                onChange={(e) => setTypedSig(e.target.value)}
                placeholder="Type your full name"
                className="w-full bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-3 text-text-primary font-display text-lg italic focus:outline-none focus:border-[rgba(0,212,255,0.3)] transition-all"
                aria-label="Type your signature"
                data-testid="nda-signature-input"
              />
            ) : (
              <div className="relative">
                <canvas
                  ref={canvasRef}
                  width={480}
                  height={100}
                  className="w-full bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl cursor-crosshair touch-none"
                  onMouseDown={startDraw}
                  onMouseMove={draw}
                  onMouseUp={stopDraw}
                  onMouseLeave={stopDraw}
                  onTouchStart={startDraw}
                  onTouchMove={draw}
                  onTouchEnd={stopDraw}
                  aria-label="Signature canvas — draw your signature"
                  data-testid="nda-signature-canvas"
                />
                {!signed && (
                  <p className="absolute inset-0 flex items-center justify-center text-text-muted text-sm pointer-events-none">
                    Draw your signature here
                  </p>
                )}
                {signed && (
                  <button
                    onClick={clearCanvas}
                    className="absolute top-2 right-2 text-xs text-text-muted hover:text-accent-red transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          {submitError && (
            <div className="text-xs text-accent-red">{submitError}</div>
          )}
          <div className="flex gap-3 pt-2">
            <Button
              size="md"
              className="flex-1"
              disabled={!canSign || isSubmitting}
              onClick={() => { void handleSign(); }}
              data-testid="nda-sign-btn"
            >
              {isSubmitting ? 'Signing…' : 'Sign & Continue'}
            </Button>
            <Button variant="ghost" size="md" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
