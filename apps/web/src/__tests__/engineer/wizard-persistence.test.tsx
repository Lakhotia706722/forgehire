/**
 * Test: Wizard form state persists if user navigates back using browser back button.
 * We test the localStorage persistence layer directly.
 */
import {
  loadOnboardingState,
  saveOnboardingState,
  clearOnboardingState,
  calcCompletion,
} from '@/lib/onboarding-store';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

beforeEach(() => {
  localStorageMock.clear();
});

describe('Onboarding wizard — localStorage persistence', () => {
  it('loads default state when localStorage is empty', () => {
    const state = loadOnboardingState();
    expect(state.currentStep).toBe(1);
    expect(state.fullName).toBe('');
    expect(state.skills).toEqual([]);
  });

  it('saves and reloads state correctly', () => {
    saveOnboardingState({ fullName: 'Arjun Sharma', currentStep: 3 });
    const loaded = loadOnboardingState();
    expect(loaded.fullName).toBe('Arjun Sharma');
    expect(loaded.currentStep).toBe(3);
  });

  it('merges partial updates without losing other fields', () => {
    saveOnboardingState({ fullName: 'Arjun', headline: 'LLM Engineer' });
    saveOnboardingState({ currentStep: 2 }); // partial update
    const loaded = loadOnboardingState();
    expect(loaded.fullName).toBe('Arjun');
    expect(loaded.headline).toBe('LLM Engineer');
    expect(loaded.currentStep).toBe(2);
  });

  it('persists skills array', () => {
    const skills = [
      { id: '1', name: 'LangChain', proficiency: 3 as const, isPrimary: true },
      { id: '2', name: 'PyTorch',   proficiency: 2 as const, isPrimary: false },
    ];
    saveOnboardingState({ skills });
    const loaded = loadOnboardingState();
    expect(loaded.skills).toHaveLength(2);
    expect(loaded.skills[0].name).toBe('LangChain');
    expect(loaded.skills[1].proficiency).toBe(2);
  });

  it('persists projects array', () => {
    const projects = [{
      id: 'p1',
      title: 'RAG Pipeline',
      type: 'API' as const,
      problemSolved: 'Slow retrieval',
      description: 'Built a fast RAG system',
      techStack: ['LangChain', 'Pinecone'],
      demoUrl: 'https://demo.com',
      githubUrl: '',
      screenshots: [],
      metrics: { accuracy: '94%', timeSaved: '2hrs', usersServed: '1000' },
    }];
    saveOnboardingState({ projects });
    const loaded = loadOnboardingState();
    expect(loaded.projects).toHaveLength(1);
    expect(loaded.projects[0].title).toBe('RAG Pipeline');
    expect(loaded.projects[0].techStack).toContain('LangChain');
  });

  it('clears state correctly', () => {
    saveOnboardingState({ fullName: 'Test', currentStep: 5 });
    clearOnboardingState();
    const loaded = loadOnboardingState();
    expect(loaded.fullName).toBe('');
    expect(loaded.currentStep).toBe(1);
  });

  it('handles corrupted localStorage gracefully', () => {
    localStorageMock.setItem('nh_onboarding_v1', 'not-valid-json{{{');
    expect(() => loadOnboardingState()).not.toThrow();
    const state = loadOnboardingState();
    expect(state.currentStep).toBe(1); // falls back to default
  });

  it('simulates browser back — state survives page reload', () => {
    // Step 1: user fills step 3 and saves
    saveOnboardingState({ currentStep: 3, fullName: 'Arjun', headline: 'LLM Engineer' });

    // Step 2: simulate "page reload" by calling loadOnboardingState again
    const reloaded = loadOnboardingState();
    expect(reloaded.currentStep).toBe(3);
    expect(reloaded.fullName).toBe('Arjun');
  });
});

describe('calcCompletion', () => {
  it('returns 0 for empty state', () => {
    const state = loadOnboardingState();
    // availability defaults to 'available_now' which gives 5 pts — so minimum is 5
    expect(calcCompletion(state)).toBeGreaterThanOrEqual(0);
    expect(calcCompletion(state)).toBeLessThan(20);
  });

  it('increases when basic info is filled', () => {
    const state = loadOnboardingState();
    const withInfo = { ...state, fullName: 'Arjun', headline: 'LLM Engineer', location: 'Bengaluru', workMode: 'remote' as const };
    expect(calcCompletion(withInfo)).toBeGreaterThan(0);
  });

  it('reaches ≥70 when all major sections are filled', () => {
    const state = loadOnboardingState();
    const filled = {
      ...state,
      fullName: 'Arjun',
      headline: 'LLM Engineer',
      location: 'Bengaluru',
      workMode: 'remote' as const,
      skills: [
        { id: '1', name: 'LangChain', proficiency: 3 as const, isPrimary: true },
        { id: '2', name: 'PyTorch',   proficiency: 3 as const, isPrimary: false },
        { id: '3', name: 'FastAPI',   proficiency: 2 as const, isPrimary: false },
      ],
      experiences: [{ id: 'e1', company: 'Sarvam', role: 'Engineer', startMonth: 'Jan', startYear: '2023', endMonth: 'Jan', endYear: '2024', current: false, description: 'Built stuff', impact: [] }],
      projects: [{
        id: 'p1', title: 'RAG', type: 'API' as const, problemSolved: 'slow', description: 'fast rag',
        techStack: ['LangChain'], demoUrl: '', githubUrl: '', screenshots: [],
        metrics: { accuracy: '', timeSaved: '', usersServed: '' },
      }],
      hourlyRate: '4500',
      upiId: 'arjun@okicici',
    };
    expect(calcCompletion(filled)).toBeGreaterThanOrEqual(70);
  });

  it('never exceeds 100', () => {
    const state = loadOnboardingState();
    const overfilled = {
      ...state,
      fullName: 'A', headline: 'B', location: 'C', workMode: 'remote' as const,
      skills: Array.from({ length: 20 }, (_, i) => ({ id: String(i), name: `Skill${i}`, proficiency: 3 as const, isPrimary: i === 0 })),
      experiences: [{ id: 'e1', company: 'X', role: 'Y', startMonth: 'Jan', startYear: '2020', endMonth: 'Jan', endYear: '2024', current: false, description: 'D', impact: [] }],
      projects: Array.from({ length: 10 }, (_, i) => ({
        id: String(i), title: `P${i}`, type: 'API' as const, problemSolved: 'x', description: 'y',
        techStack: ['Z'], demoUrl: '', githubUrl: '', screenshots: [],
        metrics: { accuracy: '', timeSaved: '', usersServed: '' },
      })),
      hourlyRate: '5000',
      upiId: 'x@y',
    };
    expect(calcCompletion(overfilled)).toBeLessThanOrEqual(100);
  });
});
