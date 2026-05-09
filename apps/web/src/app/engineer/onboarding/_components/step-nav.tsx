'use client';

import { Button } from '@/components/ui/button';

interface StepNavProps {
  step: number;
  totalSteps: number;
  onBack: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  loading?: boolean;
}

export function StepNav({
  step,
  totalSteps,
  onBack,
  onNext,
  nextLabel = 'Continue',
  nextDisabled = false,
  loading = false,
}: StepNavProps) {
  return (
    <div className="flex items-center justify-between pt-8 mt-8 border-t border-[rgba(255,255,255,0.06)]">
      {step > 1 ? (
        <Button variant="ghost" size="md" onClick={onBack} type="button">
          ← Back
        </Button>
      ) : (
        <div />
      )}
      <Button
        size="md"
        onClick={onNext}
        disabled={nextDisabled}
        loading={loading}
        type="button"
        className="min-w-[140px]"
      >
        {step === totalSteps ? 'Finish' : nextLabel}
      </Button>
    </div>
  );
}
