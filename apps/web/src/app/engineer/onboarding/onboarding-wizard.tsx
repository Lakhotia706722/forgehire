'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { apiFetch } from '@/lib/api-fetch';
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

type ExistingProfile = {
  experiences?: Array<{ id: string }>;
  projects?: Array<{ id: string }>;
};

function toISOFromMonthYear(month: string, year: string): string {
  const monthIndex = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(month);
  const safeMonth = monthIndex >= 0 ? monthIndex : 0;
  return new Date(Number(year), safeMonth, 1).toISOString();
}

export function OnboardingWizard() {
  const router = useRouter();
  const [state, setState] = React.useState<OnboardingState>(() => loadOnboardingState());
  const [direction, setDirection] = React.useState<'forward' | 'back'>('forward');
  const [animating, setAnimating] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [savingStep, setSavingStep] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

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

  async function saveCurrentStep(): Promise<void> {
    switch (state.currentStep) {
      case 1:
        await apiFetch('/api/engineer/profile/basic', {
          method: 'PUT',
          body: JSON.stringify({
            fullName: state.fullName.trim(),
            photo: state.photoUrl || null,
            headline: state.headline.trim(),
            location: state.location.trim(),
            timezone: state.timezone,
            workMode: state.workMode,
          }),
        });
        break;
      case 2: {
        const primary = state.skills.filter((s) => s.isPrimary).map((s) => s.name);
        const fallbackPrimary = primary.length ? primary : state.skills.slice(0, 1).map((s) => s.name);
        await apiFetch('/api/engineer/profile/skills', {
          method: 'PUT',
          body: JSON.stringify({
            primarySkills: fallbackPrimary,
            secondarySkills: state.skills.filter((s) => !fallbackPrimary.includes(s.name)).map((s) => s.name),
          }),
        });
        break;
      }
      case 3: {
        const existing = await apiFetch<ExistingProfile>('/api/engineer/profile');
        await Promise.all(
          (existing.experiences ?? []).map((exp) =>
            apiFetch(`/api/engineer/profile/experience/${exp.id}`, { method: 'DELETE' }),
          ),
        );
        for (const exp of state.experiences) {
          await apiFetch(`/api/engineer/profile/experience/${exp.id}`, {
            method: 'POST',
            body: JSON.stringify({
              companyName: exp.company,
              roleTitle: exp.role,
              startDate: toISOFromMonthYear(exp.startMonth, exp.startYear),
              endDate: exp.current ? null : toISOFromMonthYear(exp.endMonth, exp.endYear),
              description: exp.description,
              impactMetrics: exp.impact.map((i) => `${i.key}: ${i.value}`).filter(Boolean).join(' | '),
              techUsed: [],
              verified: false,
            }),
          });
        }
        break;
      }
      case 4: {
        const existing = await apiFetch<ExistingProfile>('/api/engineer/profile');
        await Promise.all(
          (existing.projects ?? []).map((proj) =>
            apiFetch(`/api/engineer/profile/projects/${proj.id}`, { method: 'DELETE' }),
          ),
        );
        for (const proj of state.projects) {
          await apiFetch(`/api/engineer/profile/projects/${proj.id}`, {
            method: 'POST',
            body: JSON.stringify({
              title: proj.title,
              type: proj.type,
              problemSolved: proj.problemSolved || proj.description,
              description: proj.description,
              techStack: proj.techStack,
              modelUsed: null,
              architectureType: null,
              industryUseCase: null,
              demoUrl: proj.demoUrl || null,
              githubUrl: proj.githubUrl || null,
              screenshots: proj.screenshots.slice(0, 5),
              performanceMetrics: [proj.metrics.accuracy, proj.metrics.timeSaved, proj.metrics.usersServed].filter(Boolean).join(' | '),
              monetizationStatus: 'Free',
            }),
          });
        }
        break;
      }
      case 5:
        await apiFetch('/api/engineer/profile/pricing', {
          method: 'PUT',
          body: JSON.stringify({
            hourlyRate: state.hourlyRate ? parseFloat(state.hourlyRate) : null,
            projectRate: state.projectMinRate ? parseFloat(state.projectMinRate) : null,
            availabilityStatus: state.availability === 'available_in_weeks' ? 'available_in_x_weeks' : state.availability,
            availableFrom:
              state.availability === 'available_in_weeks' && state.availableInWeeks
                ? new Date(Date.now() + Number(state.availableInWeeks) * 7 * 24 * 60 * 60 * 1000).toISOString()
                : null,
          }),
        });
        break;
      case 6:
        await apiFetch('/api/engineer/profile/payment', {
          method: 'PUT',
          body: JSON.stringify({
            upiId: state.upiId,
            bankAccount:
              state.bankAccountNumber || state.bankIfsc || state.bankAccountName
                ? {
                    accountNumber: state.bankAccountNumber || null,
                    ifsc: state.bankIfsc || null,
                    accountHolderName: state.bankAccountName || null,
                  }
                : null,
            panNumber: null,
          }),
        });
        break;
      default:
        break;
    }
  }

  async function handleNext() {
    if (state.currentStep >= TOTAL_STEPS) return;
    setSubmitError(null);
    setSavingStep(true);
    try {
      await saveCurrentStep();
      goToStep(state.currentStep + 1, 'forward');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save step';
      setSubmitError(msg);
      toast.error(msg);
    } finally {
      setSavingStep(false);
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

  async function handleConfirm() {
    if (submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await apiFetch('/api/engineer/profile/complete', { method: 'POST' });
      clearOnboardingState();
      patch({ submitted: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Submission failed. Please try again.';
      setSubmitError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  function isNextDisabled(): boolean {
    switch (state.currentStep) {
      case 1:
        return !state.fullName.trim() || !state.headline.trim() || !state.location.trim() || !state.workMode;
      case 2:
        return state.skills.length < 1;
      case 4:
        return state.projects.length === 0;
      case 5:
        return !state.hourlyRate.trim();
      case 6:
        return !state.upiId.trim();
      default:
        return false;
    }
  }

  const slideClass = cn(
    'transition-all duration-[350ms]',
    animating
      ? direction === 'forward'
        ? 'opacity-0 -translate-x-6'
        : 'opacity-0 translate-x-6'
      : 'opacity-100 translate-x-0',
  );

  return (
    <WizardChrome currentStep={state.currentStep} state={state}>
      <div className={slideClass} data-testid="wizard-step">
        {state.currentStep === 1 && <Step1BasicInfo state={state} onChange={patch} />}
        {state.currentStep === 2 && <Step2Skills state={state} onChange={patch} />}
        {state.currentStep === 3 && <Step3Experience state={state} onChange={patch} />}
        {state.currentStep === 4 && <Step4Projects state={state} onChange={patch} />}
        {state.currentStep === 5 && <Step5Pricing state={state} onChange={patch} />}
        {state.currentStep === 6 && <Step6Payment state={state} onChange={patch} />}
        {state.currentStep === 7 && <Step7Review state={state} onJumpTo={handleJumpTo} />}
        {state.currentStep === 8 && (
          <Step8Confirmation
            onSaveLater={handleSaveLater}
            onConfirm={handleConfirm}
            submitting={submitting}
            submitError={submitError}
            submitted={state.submitted}
          />
        )}

        {state.currentStep < 8 && (
          <StepNav
            step={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onBack={handleBack}
            onNext={handleNext}
            nextDisabled={isNextDisabled()}
            loading={savingStep}
          />
        )}
      </div>
    </WizardChrome>
  );
}
