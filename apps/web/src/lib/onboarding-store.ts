'use client';

/**
 * Onboarding wizard state — persisted to localStorage so browser-back works.
 * Uses a simple module-level store with React state sync via custom hook.
 */

export type WorkMode = 'remote' | 'hybrid' | 'onsite';
export type ProjectType = 'Agent' | 'SaaS' | 'API' | 'Tool' | 'Model';
export type AvailabilityState = 'available_now' | 'available_in_weeks' | 'not_available';

export interface SkillEntry {
  id: string;
  name: string;
  proficiency: 1 | 2 | 3;
  isPrimary: boolean;
}

export interface ExperienceEntry {
  id: string;
  company: string;
  role: string;
  startMonth: string;
  startYear: string;
  endMonth: string;
  endYear: string;
  current: boolean;
  description: string;
  impact: { id: string; key: string; value: string }[];
}

export interface ProjectEntry {
  id: string;
  title: string;
  type: ProjectType;
  problemSolved: string;
  description: string;
  techStack: string[];
  demoUrl: string;
  githubUrl: string;
  screenshots: string[];
  metrics: {
    accuracy: string;
    timeSaved: string;
    usersServed: string;
  };
}

export interface OnboardingState {
  currentStep: number;
  // Step 1
  photoUrl: string;
  fullName: string;
  headline: string;
  location: string;
  timezone: string;
  workMode: WorkMode | null;
  // Step 2
  skills: SkillEntry[];
  // Step 3
  experiences: ExperienceEntry[];
  // Step 4
  projects: ProjectEntry[];
  // Step 5
  hourlyRate: string;
  projectMinRate: string;
  availability: AvailabilityState;
  availableInWeeks: string;
  // Step 6
  upiId: string;
  bankAccountNumber: string;
  bankIfsc: string;
  bankAccountName: string;
  // Step 7 / 8
  submitted: boolean;
}

const STORAGE_KEY = 'nh_onboarding_v1';

export const defaultOnboardingState: OnboardingState = {
  currentStep: 1,
  photoUrl: '',
  fullName: '',
  headline: '',
  location: '',
  timezone: 'Asia/Kolkata',
  workMode: null,
  skills: [],
  experiences: [],
  projects: [],
  hourlyRate: '',
  projectMinRate: '',
  availability: 'available_now',
  availableInWeeks: '',
  upiId: '',
  bankAccountNumber: '',
  bankIfsc: '',
  bankAccountName: '',
  submitted: false,
};

export function loadOnboardingState(): OnboardingState {
  if (typeof window === 'undefined') return defaultOnboardingState;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultOnboardingState;
    return { ...defaultOnboardingState, ...JSON.parse(raw) };
  } catch {
    return defaultOnboardingState;
  }
}

export function saveOnboardingState(state: Partial<OnboardingState>): void {
  if (typeof window === 'undefined') return;
  try {
    const current = loadOnboardingState();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...state }));
  } catch {
    // ignore storage errors
  }
}

export function clearOnboardingState(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

/** Calculate completion percentage from state */
export function calcCompletion(state: OnboardingState): number {
  let score = 0;
  const max = 100;

  // Step 1 — 20 pts
  if (state.fullName.trim())    score += 5;
  if (state.headline.trim())    score += 5;
  if (state.location.trim())    score += 5;
  if (state.workMode)           score += 5;

  // Step 2 — 15 pts
  if (state.skills.length >= 3) score += 15;
  else if (state.skills.length > 0) score += 5;

  // Step 3 — 15 pts
  if (state.experiences.length > 0) score += 15;

  // Step 4 — 25 pts (most critical)
  if (state.projects.length > 0) {
    const complete = state.projects.filter(
      (p) => p.title && p.description && p.techStack.length > 0
    ).length;
    score += Math.min(25, complete * 12);
  }

  // Step 5 — 15 pts
  if (state.hourlyRate) score += 10;
  if (state.availability) score += 5;

  // Step 6 — 10 pts
  if (state.upiId) score += 10;

  return Math.min(max, score);
}
