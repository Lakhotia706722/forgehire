import type { BountyCard, BountyDetail, Difficulty, TaskType } from './bounty-data';

const COMPANY_COLORS = ['#00D4FF', '#7B5EA7', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6'];

function colorFromName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COMPANY_COLORS[Math.abs(hash) % COMPANY_COLORS.length];
}

function initialsFromName(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function toTaskType(type: string): TaskType {
  const normalized = type?.toLowerCase() ?? '';
  if (normalized === 'direct') return 'Direct';
  if (normalized === 'contest') return 'Contest';
  return 'Bounty';
}

function toDifficulty(difficulty: string): Difficulty {
  const d = difficulty?.toLowerCase() ?? '';
  if (d === 'beginner' || d === 'easy') return 'Beginner';
  if (d === 'intermediate' || d === 'medium') return 'Intermediate';
  if (d === 'advanced' || d === 'hard') return 'Advanced';
  if (d === 'expert') return 'Expert';
  return 'Intermediate';
}

/** Maps API task feed item → BountyCard for the engineer bounty board UI. */
export function mapApiTaskToBountyCard(task: Record<string, unknown>): BountyCard {
  const companyProfile = task.companyProfile as Record<string, unknown> | undefined;
  const companyName = String(companyProfile?.companyName ?? 'Company');
  const deadlineRaw = task.deadline as string | undefined;
  const timeline = Number(task.timeline ?? 14);

  return {
    id: String(task.id),
    type: toTaskType(String(task.type ?? 'bounty')),
    title: String(task.title ?? ''),
    description: String(task.problemStatement ?? task.description ?? ''),
    company: companyName,
    companyInitials: initialsFromName(companyName),
    companyColor: colorFromName(companyName),
    companyVerified: Boolean(companyProfile?.websiteVerified),
    skills: Array.isArray(task.techRequirements)
      ? (task.techRequirements as string[])
      : Array.isArray(task.autoTaggedSkills)
        ? (task.autoTaggedSkills as string[])
        : [],
    reward: Number(task.rewardAmount ?? 0),
    currency: String(task.currency ?? 'INR'),
    difficulty: toDifficulty(String(task.difficulty ?? 'intermediate')),
    deadline: deadlineRaw
      ? new Date(deadlineRaw)
      : new Date(Date.now() + timeline * 24 * 60 * 60 * 1000),
    minNeuronScore: Number(task.minNeuronScore ?? 0),
    participantCount: Number(
      task.participantCount ??
        (task._count as { participations?: number } | undefined)?.participations ??
        0,
    ),
    ndaRequired: Boolean(task.ndaRequired),
    status: 'open',
  };
}

/** Maps API task detail → BountyDetail for engineer bounty detail page. */
export function mapApiTaskToBountyDetail(task: Record<string, unknown>): BountyDetail {
  const card = mapApiTaskToBountyCard(task);
  const deliverables = Array.isArray(task.deliverables)
    ? (task.deliverables as { title?: string; description?: string }[]).map((d, i) => ({
        title: String(d.title ?? `Deliverable ${i + 1}`),
        description: String(d.description ?? ''),
      }))
    : [];

  const questions = Array.isArray(task.questions)
    ? (task.questions as Record<string, unknown>[]).map((q) => ({
        id: String(q.id),
        question: String(q.question ?? ''),
        askedBy: String(q.askedBy ?? 'Engineer'),
        askedAt: String(q.createdAt ?? ''),
        answer: q.answer as string | undefined,
        answeredAt: q.answeredAt as string | undefined,
        isPublic: Boolean(q.isPublic),
      }))
    : [];

  return {
    ...card,
    problemStatement: String(task.problemStatement ?? card.description),
    currentState: String(task.currentState ?? ''),
    expectedOutcome: String(task.expectedOutcome ?? ''),
    successCriteria: Array.isArray(task.selectionCriteria)
      ? (task.selectionCriteria as string[])
      : [],
    deliverables,
    techRequirements: card.skills,
    accessProvided: Array.isArray(task.accessProvided)
      ? (task.accessProvided as string[])
      : [],
    aiEstimatedDays: [
      Number(task.aiEstimatedDaysMin ?? 7),
      Number(task.aiEstimatedDaysMax ?? 21),
    ],
    aiSuggestedReward: [
      Number(task.aiSuggestedRewardMin ?? card.reward * 0.8),
      Number(task.aiSuggestedRewardMax ?? card.reward * 1.2),
    ],
    aiRecommendedType: card.type,
    aiPostingQuality: Number(task.aiPostingQuality ?? 75),
    questions,
  };
}
