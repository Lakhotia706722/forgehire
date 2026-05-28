import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SubmissionDetailPage from '@/app/company/tasks/[id]/submissions/[sid]/page';

const pushMock = jest.fn();
const approveMutateAsync = jest.fn();
const rejectMutateAsync = jest.fn();
const evaluateMutateAsync = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, replace: jest.fn(), prefetch: jest.fn() }),
}));

jest.mock('@/lib/api-hooks', () => ({
  useSubmissionDetail: jest.fn(() => ({
    data: {
      id: 'sub-1',
      engineerName: 'Arjun Sharma',
      submittedAt: new Date().toISOString(),
      neuronScore: 810,
      score: 72,
      status: 'pending',
      description: 'Implemented full feature set',
      performanceMetrics: { quality: 'A' },
      screenshots: [],
      demoUrl: null,
      githubUrl: null,
      feedback: null,
    },
    isLoading: false,
    error: null,
  })),
  useApproveSubmission: jest.fn(() => ({
    mutateAsync: approveMutateAsync,
    isPending: false,
  })),
  useRejectSubmission: jest.fn(() => ({
    mutateAsync: rejectMutateAsync,
    isPending: false,
  })),
  useEvaluateSubmission: jest.fn(() => ({
    mutateAsync: evaluateMutateAsync,
    isPending: false,
  })),
}));

describe('Company submission review actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    approveMutateAsync.mockResolvedValue({});
    rejectMutateAsync.mockResolvedValue({});
    evaluateMutateAsync.mockResolvedValue({});
  });

  it('sends evaluate mutation for Need Changes and redirects', async () => {
    const user = userEvent.setup();
    render(<SubmissionDetailPage params={{ id: 'task-1', sid: 'sub-1' }} />);

    const feedbackBox = screen.getByPlaceholderText(/Provide constructive feedback/i);
    await user.type(feedbackBox, 'Please improve test coverage and optimize the query path.');

    const scoreInput = screen.getByRole('spinbutton');
    await user.clear(scoreInput);
    await user.type(scoreInput, '105');

    await user.click(screen.getByRole('button', { name: /Need Changes/i }));

    await waitFor(() => {
      expect(evaluateMutateAsync).toHaveBeenCalledWith({
        submissionId: 'sub-1',
        score: 100,
        feedback: 'Please improve test coverage and optimize the query path.',
      });
    });
    expect(pushMock).toHaveBeenCalledWith('/company/tasks/task-1/submissions');
  });

  it('disables all actions and inputs while a decision mutation is pending', () => {
    const hooks = jest.requireMock('@/lib/api-hooks');
    hooks.useApproveSubmission.mockReturnValue({
      mutateAsync: approveMutateAsync,
      isPending: true,
    });

    render(<SubmissionDetailPage params={{ id: 'task-1', sid: 'sub-1' }} />);

    expect(screen.getByRole('button', { name: /Approve & Release Payment/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Need Changes/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /^Reject$/i })).toBeDisabled();
    expect(screen.getByPlaceholderText(/Provide constructive feedback/i)).toBeDisabled();
    expect(screen.getByRole('spinbutton')).toBeDisabled();
  });
});
