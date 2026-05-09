import type { PostTaskState, TaskType, Difficulty, PaymentType } from '@/lib/bounty-data';

export const DEFAULT_POST_TASK_STATE: PostTaskState = {
  type: null,
  title: '',
  categories: [],
  problemStatement: '',
  currentState: '',
  expectedOutcome: '',
  deliverables: [],
  techRequirements: [],
  startDate: '',
  deadline: '',
  rewardAmount: '',
  paymentType: 'fixed',
  contestPrizes: [
    { id: '1', rank: 1, label: '1st Place', amount: 0, percentage: 50 },
    { id: '2', rank: 2, label: '2nd Place', amount: 0, percentage: 30 },
    { id: '3', rank: 3, label: '3rd Place', amount: 0, percentage: 20 },
  ],
  ndaRequired: false,
  minNeuronScore: 0,
  difficulty: '',
  accessTypes: [],
  aiResult: null,
};
