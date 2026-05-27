'use client';

import dynamic from 'next/dynamic';
import { OnboardingLoading } from './onboarding-loading';

const OnboardingWizard = dynamic(
  () => import('./onboarding-wizard').then((m) => m.OnboardingWizard),
  { ssr: false, loading: () => <OnboardingLoading /> },
);

export default function OnboardingPage() {
  return <OnboardingWizard />;
}
