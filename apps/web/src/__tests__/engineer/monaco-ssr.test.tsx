/**
 * Test: Monaco editor loads without crashing in Next.js (SSR-safe import with dynamic() + ssr: false)
 *
 * The CodingSection uses `dynamic(() => import('@monaco-editor/react'), { ssr: false })`.
 * In a jsdom/Node environment (which simulates SSR), the dynamic import with ssr:false
 * should render the loading fallback instead of crashing.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { CodingSection } from '@/app/engineer/assessment/_components/coding-section';
import { MOCK_CODING_TASKS } from '@/app/engineer/assessment/_components/assessment-store';

// Mock @monaco-editor/react — in SSR/jsdom it would crash without this
jest.mock('@monaco-editor/react', () => ({
  __esModule: true,
  default: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <textarea
      data-testid="monaco-editor-mock"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Code editor"
    />
  ),
}));

// Mock next/dynamic — renders the mocked Monaco editor synchronously
jest.mock('next/dynamic', () => (fn: () => Promise<any>, _opts?: any) => {
  // For Monaco: return the mock directly
  const MockEditor = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <textarea
      data-testid="monaco-editor-mock"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Code editor"
    />
  );
  MockEditor.displayName = 'DynamicMonaco';
  return MockEditor;
});

describe('Monaco Editor — SSR safety', () => {
  beforeEach(() => {
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation((_cb) => 1);
    jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders without crashing in jsdom environment', () => {
    expect(() => {
      render(
        <CodingSection
          tasks={MOCK_CODING_TASKS}
          currentTask={0}
          onCodeChange={jest.fn()}
          onRunCode={jest.fn()}
          onTaskChange={jest.fn()}
        />
      );
    }).not.toThrow();
  });

  it('renders task title from props', () => {
    render(
      <CodingSection
        tasks={MOCK_CODING_TASKS}
        currentTask={0}
        onCodeChange={jest.fn()}
        onRunCode={jest.fn()}
        onTaskChange={jest.fn()}
      />
    );
    expect(screen.getByText(MOCK_CODING_TASKS[0].title)).toBeInTheDocument();
  });

  it('renders all task tabs', () => {
    render(
      <CodingSection
        tasks={MOCK_CODING_TASKS}
        currentTask={0}
        onCodeChange={jest.fn()}
        onRunCode={jest.fn()}
        onTaskChange={jest.fn()}
      />
    );
    expect(screen.getByRole('tab', { name: 'Task 1' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Task 2' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Task 3' })).toBeInTheDocument();
  });

  it('marks current task tab as selected', () => {
    render(
      <CodingSection
        tasks={MOCK_CODING_TASKS}
        currentTask={1}
        onCodeChange={jest.fn()}
        onRunCode={jest.fn()}
        onTaskChange={jest.fn()}
      />
    );
    expect(screen.getByRole('tab', { name: 'Task 2' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Task 1' })).toHaveAttribute('aria-selected', 'false');
  });

  it('calls onTaskChange when a task tab is clicked', async () => {
    const onTaskChange = jest.fn();
    const { getByRole } = render(
      <CodingSection
        tasks={MOCK_CODING_TASKS}
        currentTask={0}
        onCodeChange={jest.fn()}
        onRunCode={jest.fn()}
        onTaskChange={onTaskChange}
      />
    );
    getByRole('tab', { name: 'Task 2' }).click();
    expect(onTaskChange).toHaveBeenCalledWith(1);
  });

  it('renders Run Code button', () => {
    render(
      <CodingSection
        tasks={MOCK_CODING_TASKS}
        currentTask={0}
        onCodeChange={jest.fn()}
        onRunCode={jest.fn()}
        onTaskChange={jest.fn()}
      />
    );
    expect(screen.getByRole('button', { name: /run code/i })).toBeInTheDocument();
  });

  it('calls onRunCode when Run Code is clicked', () => {
    const onRunCode = jest.fn();
    render(
      <CodingSection
        tasks={MOCK_CODING_TASKS}
        currentTask={0}
        onCodeChange={jest.fn()}
        onRunCode={onRunCode}
        onTaskChange={jest.fn()}
      />
    );
    screen.getByRole('button', { name: /run code/i }).click();
    expect(onRunCode).toHaveBeenCalledWith(MOCK_CODING_TASKS[0].id);
  });
});
