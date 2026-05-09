'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  loadOnboardingState,
  saveOnboardingState,
  clearOnboardingState,
  type OnboardingState,
} from '@/lib/onboarding-store';
import { WizardChrome } from './_components/wizard-chrome';
import { StepNav } from './_components/step-nav';
import { Step1BasicInfo } from './_components/step1-basic-info';
import { Step2Skills } from './_components/step2-skills';
import { Step3Experience } from './_components/step3-experience';
import { Step4Projects } from './_components/step4-projects';
import { Step5Pricing } from './_components/step5-pricing';
import { Step6Payment } from './_components/step6-payment';
import { Step7Review } from './_components/step7-review';
import { Step8Confirmation } from './_components/step8-confirmation';

const TOTAL_STEPS = 8;

export default function OnboardingPage() {
  const router = useRouter();
  const [state, setState] = React.useState<OnboardingState>(() => loadOnboardingState());
  const [direction, setDirection] = React.useState<'forward' | 'back'>('forward');
  const [animating, setAnimating] = React.useState(false);

  // Persist on every change
  React.useEffect(() => {
    saveOnboardingState(state);
  }, [state]);

  function patch(update: Partial<OnboardingState>) {
    setState((prev) => ({ ...prev, ...update }));
  }

  function goToStep(next: number, dir: 'forward' | 'back' = 'forward') {
    if (animating) return;
    setDirection(dir);
    setAnimating(true);
    setTimeout(() => {
      setState((prev) => ({ ...prev, currentStep: next }));
      setAnimating(false);
    }, 350);
  }

  function handleNext() {
    if (state.currentStep < TOTAL_STEPS) {
      goToStep(state.currentStep + 1, 'forward');
    }
  }

  function handleBack() {
    if (state.currentStep > 1) {
      goToStep(state.currentStep - 1, 'back');
    }
  }

  function handleJumpTo(step: number) {
    goToStep(step, step < state.currentStep ? 'back' : 'forward');
  }

  function handleSaveLater() {
    router.push('/engineer/dashboard');
  }

  // Validation per step
  function isNextDisabled(): boolean {
    switch (state.currentStep) {
      case 1: return !state.fullName.trim() || !state.workMode;
      case 4: return state.projects.length === 0;
      default: return false;
    }
  }

  const slideClass = cn(
    'transition-all duration-[350ms]',
    animating
      ? direction === 'forward'
        ? 'opacity-0 -translate-x-6'
        : 'opacity-0 translate-x-6'
      : 'opacity-100 translate-x-0'
  );

  return (
    <WizardChrome currentStep={state.currentStep} state={state}>
      <div className={slideClass} data-testid="wizard-step">
        {state.currentStep === 1 && (
          <Step1BasicInfo state={state} onChange={patch} />
        )}
        {state.currentStep === 2 && (
          <Step2Skills state={state} onChange={patch} />
        )}
        {state.currentStep === 3 && (
          <Step3Experience state={state} onChange={patch} />
        )}
        {state.currentStep === 4 && (
          <Step4Projects state={state} onChange={patch} />
        )}
        {state.currentStep === 5 && (
          <Step5Pricing state={state} onChange={patch} />
        )}
        {state.currentStep === 6 && (
          <Step6Payment state={state} onChange={patch} />
        )}
        {state.currentStep === 7 && (
          <Step7Review state={state} onJumpTo={handleJumpTo} />
        )}
        {state.currentStep === 8 && (
          <Step8Confirmation onSaveLater={handleSaveLater} />
        )}

        {state.currentStep < 8 && (
          <StepNav
            step={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onBack={handleBack}
            onNext={handleNext}
            nextDisabled={isNextDisabled()}
          />
        )}
      </div>
    </WizardChrome>
  );
}
