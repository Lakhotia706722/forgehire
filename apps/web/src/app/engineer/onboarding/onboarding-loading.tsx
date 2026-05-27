'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { defaultOnboardingState } from '@/lib/onboarding-store';
import { WizardChrome } from './_components/wizard-chrome';

export function OnboardingLoading() {
  return (
    <WizardChrome currentStep={1} state={defaultOnboardingState}>
      <div className="space-y-4" aria-busy="true" aria-label="Loading onboarding">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    </WizardChrome>
  );
}
