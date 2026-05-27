import {
  PrismaClient,
  TaskStatus,
  TaskType,
  SubmissionStatus,
  Prisma,
} from "@prisma/client";
import { RazorpayEscrowService } from "./razorpay-escrow.service";
import { TaskAIEnrichmentService } from "./task-ai-enrichment.service";
import { NDAGeneratorService } from "./nda-generator.service";
import {
  CreateTaskInput,
  DepositEscrowInput,
  ParticipateTaskInput,
  SubmitTaskInput,
  EvaluateSubmissionInput,
  SelectWinnerInput,
  SelectMultipleWinnersInput,
  AskQuestionInput,
  AnswerQuestionInput,
  SignNDAInput,
  TaskSearchInput,
} from "@neuronhire/shared";

export class TaskService {
  private prisma: PrismaClient;
  private escrowService: RazorpayEscrowService;
  private enrichmentService: TaskAIEnrichmentService;
  private ndaService: NDAGeneratorService;

  constructor() {
    this.prisma = new PrismaClient();
    this.escrowService = new RazorpayEscrowService();
    this.enrichmentService = new TaskAIEnrichmentService();
    this.ndaService = new NDAGeneratorService();
  }

  async createTask(userId: string, data: CreateTaskInput) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { companyProfile: true },
    });

    if (!user || !user.companyProfile) {
      throw new Error("Company profile not found");
    }

    if (user.role !== "company") {
      throw new Error("Only companies can create tasks");
    }

    const validation = this.enrichmentService.validateTaskPosting(data);
    if (!validation.isValid) {
      throw new Error(
        `Task validation failed: ${validation.errors.join(", ")}`,
      );
    }

    const deadline = new Date();
    deadline.setDate(deadline.getDate() + data.timeline);

    const task = await this.prisma.task.create({
      data: {
        userId,
        companyProfileId: user.companyProfile.id,
        title: data.title,
        type: data.type,
        category: data.category,
        problemStatement: data.problemStatement,
        currentState: data.currentState || null,
        expectedOutcome: data.expectedOutcome,
        deliverables: data.deliverables,
        techRequirements: data.techRequirements,
        timeline: data.timeline,
        deadline,
        rewardAmount: data.rewardAmount,
        paymentType: data.paymentType,
        currency: data.currency,
        selectionCriteria: data.selectionCriteria,
        minNeuronScore: data.minNeuronScore,
        ndaRequired: data.ndaRequired,
        difficulty: data.difficulty,
        status: TaskStatus.draft,
        isContest: data.isContest || data.type === "contest",
        contestRanks: data.contestRanks
          ? (data.contestRanks as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        maxWinners: data.maxWinners || null,
        autoTaggedSkills: [],
      },
    });

    await this.enrichmentService.queueEnrichment(task.id, data);
    return task;
  }

  async enrichTask(taskId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new Error("Task not found");
    }

    const enrichment = await this.enrichmentService.enrichTask({
      title: task.title,
      type: task.type,
      problemStatement: task.problemStatement,
      expectedOutcome: task.expectedOutcome,
      deliverables: task.deliverables,
      techRequirements: task.techRequirements,
      timeline: task.timeline,
      rewardAmount: task.rewardAmount.toString(),
      difficulty: task.difficulty,
    });

    return await this.prisma.task.update({
      where: { id: taskId },
      data: {
        aiEnriched: true,
        estimatedTimeline: enrichment.estimatedTimeline,
        suggestedReward: enrichment.suggestedReward,
        vagueDeliverables: enrichment.vagueDeliverables,
        recommendedType: enrichment.recommendedType as TaskType,
        autoTaggedSkills: enrichment.autoTaggedSkills,
        postingQuality: enrichment.postingQuality,
        aiSuggestions: enrichment.suggestions,
      },
    });
  }

  async createEscrowOrder(taskId: string, userId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { companyProfile: true },
    });

    if (!task) {
      throw new Error("Task not found");
    }

    if (task.userId !== userId) {
      throw new Error("Unauthorized");
    }

    if (task.status !== TaskStatus.draft) {
      throw new Error("Task must be in draft state to create escrow");
    }

    const order = await this.escrowService.createEscrowOrder(
      taskId,
      parseFloat(task.rewardAmount.toString()),
      task.currency,
    );

    await this.prisma.task.update({
      where: { id: taskId },
      data: {
        status: TaskStatus.pending_escrow,
        escrowId: order.orderId,
        escrowAmount: order.amount,
      },
    });

    return order;
  }

  async depositEscrow(
    taskId: string,
    userId: string,
    data: DepositEscrowInput,
  ) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new Error("Task not found");
    }

    if (task.userId !== userId) {
      throw new Error("Unauthorized");
    }

    if (task.status !== TaskStatus.pending_escrow) {
      throw new Error("Task is not awaiting escrow deposit");
    }

    const isValid = await this.escrowService.verifyEscrowPayment(
      data.orderId,
      data.paymentId,
      data.signature,
    );

    if (!isValid) {
      throw new Error("Payment verification failed");
    }

    const updatedTask = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        escrowDeposited: true,
        paymentId: data.paymentId,
        status: TaskStatus.open,
        publishedAt: new Date(),
      },
    });

    return updatedTask;
  }

  async getTaskFeed(filters: TaskSearchInput, engineerProfileId?: string) {
    const where: any = {
      status: TaskStatus.open,
    };

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.category && filters.category.length > 0) {
      where.category = { hasSome: filters.category };
    }

    if (filters.difficulty) {
      where.difficulty = filters.difficulty;
    }

    if (filters.minReward || filters.maxReward) {
      where.rewardAmount = {};
      if (filters.minReward) {
        where.rewardAmount.gte = filters.minReward;
      }
      if (filters.maxReward) {
        where.rewardAmount.lte = filters.maxReward;
      }
    }

    if (filters.skills && filters.skills.length > 0) {
      where.OR = [
        { techRequirements: { hasSome: filters.skills } },
        { autoTaggedSkills: { hasSome: filters.skills } },
      ];
    }

    if (filters.ndaRequired !== undefined) {
      where.ndaRequired = filters.ndaRequired;
    }

    if (filters.query) {
      where.OR = [
        { title: { contains: filters.query, mode: "insensitive" } },
        { problemStatement: { contains: filters.query, mode: "insensitive" } },
      ];
    }

    if (engineerProfileId) {
      const profile = await this.prisma.engineerProfile.findUnique({
        where: { id: engineerProfileId },
      });

      if (profile && (filters.minNeuronScore || filters.maxNeuronScore)) {
        where.minNeuronScore = {};
        if (filters.minNeuronScore) {
          where.minNeuronScore.gte = filters.minNeuronScore;
        }
        if (filters.maxNeuronScore) {
          where.minNeuronScore.lte = filters.maxNeuronScore;
        }
      }
    }

    const cursorCondition = filters.cursor ? { id: filters.cursor } : undefined;

    const tasks = await this.prisma.task.findMany({
      where,
      take: filters.limit + 1,
      skip: filters.cursor ? 1 : 0,
      cursor: cursorCondition,
      orderBy: {
        [filters.sortBy]: filters.sortOrder,
      },
      include: {
        companyProfile: {
          select: {
            companyName: true,
            logoUrl: true,
            trustScore: true,
            websiteVerified: true,
          },
        },
        _count: {
          select: {
            participations: true,
            submissions: true,
            questions: true,
          },
        },
      },
    });

    const hasMore = tasks.length > filters.limit;
    const items = hasMore ? tasks.slice(0, -1) : tasks;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return {
      items,
      nextCursor,
      hasMore,
    };
  }

  async getCompanyTasks(
    userId: string,
    filters: { status?: string; limit?: number } = {},
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { companyProfile: true },
    });

    if (!user?.companyProfile) {
      throw new Error("Company profile not found");
    }

    const where: Prisma.TaskWhereInput = {
      companyProfileId: user.companyProfile.id,
    };

    if (filters.status) {
      where.status = filters.status as TaskStatus;
    }

    const tasks = await this.prisma.task.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: filters.limit ?? 50,
      include: {
        _count: {
          select: {
            participations: true,
            submissions: true,
          },
        },
      },
    });

    return tasks.map((task) => ({
      id: task.id,
      title: task.title,
      type: task.type,
      status: task.status,
      rewardAmount: Number(task.rewardAmount),
      deadline: task.deadline,
      participantCount: task._count.participations,
      submissionCount: task._count.submissions,
      difficulty: task.difficulty,
      ndaRequired: task.ndaRequired,
      problemStatement: task.problemStatement,
      expectedOutcome: task.expectedOutcome,
      techRequirements: task.techRequirements,
      minNeuronScore: task.minNeuronScore,
    }));
  }

  async getTask(taskId: string, userId?: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        companyProfile: {
          select: {
            companyName: true,
            logoUrl: true,
            trustScore: true,
            websiteVerified: true,
            website: true,
          },
        },
        participations: {
          include: {
            engineerProfile: {
              select: {
                fullName: true,
                neuronScore: true,
                neuronTier: true,
              },
            },
          },
        },
        submissions: {
          where: userId ? { userId } : undefined,
          include: {
            engineerProfile: {
              select: {
                fullName: true,
                neuronScore: true,
              },
            },
          },
        },
        questions: {
          where: { isPublic: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!task) {
      throw new Error("Task not found");
    }

    await this.prisma.task.update({
      where: { id: taskId },
      data: { viewCount: { increment: 1 } },
    });

    if (task.ndaRequired && userId) {
      const engineerProfile = await this.prisma.engineerProfile.findUnique({
        where: { userId },
      });

      if (engineerProfile) {
        const ndaSignature = await this.prisma.taskNDASignature.findUnique({
          where: {
            taskId_engineerProfileId: {
              taskId,
              engineerProfileId: engineerProfile.id,
            },
          },
        });

        if (!ndaSignature || !ndaSignature.signed) {
          return {
            ...task,
            problemStatement: "NDA required - sign to view full details",
            currentState: null,
            deliverables: [],
            selectionCriteria: [],
          };
        }
      }
    }

    return task;
  }

  async participateInTask(
    taskId: string,
    userId: string,
    data: ParticipateTaskInput,
  ) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new Error("Task not found");
    }

    if (task.status !== TaskStatus.open) {
      throw new Error("Task is not open for participation");
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { engineerProfile: true },
    });

    if (!user || !user.engineerProfile) {
      throw new Error("Engineer profile not found");
    }

    if (user.role !== "engineer") {
      throw new Error("Only engineers can participate in tasks");
    }

    if (user.engineerProfile.neuronScore < task.minNeuronScore) {
      throw new Error(
        `NeuronScore ${user.engineerProfile.neuronScore} is below minimum required ${task.minNeuronScore}. Take a mini-gate test to qualify.`,
      );
    }

    const existing = await this.prisma.taskParticipation.findUnique({
      where: {
        taskId_engineerProfileId: {
          taskId,
          engineerProfileId: user.engineerProfile.id,
        },
      },
    });

    if (existing) {
      throw new Error("Already participated in this task");
    }

    const participation = await this.prisma.taskParticipation.create({
      data: {
        taskId,
        userId,
        engineerProfileId: user.engineerProfile.id,
        approach: data.approach,
        estimatedTime: data.estimatedTime,
        proposedRate: data.proposedRate,
      },
    });

    await this.prisma.task.update({
      where: { id: taskId },
      data: { participantCount: { increment: 1 } },
    });

    return participation;
  }

  async submitTask(taskId: string, userId: string, data: SubmitTaskInput) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new Error("Task not found");
    }

    if (
      task.status !== TaskStatus.open &&
      task.status !== TaskStatus.in_progress
    ) {
      throw new Error("Task is not accepting submissions");
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { engineerProfile: true },
    });

    if (!user || !user.engineerProfile) {
      throw new Error("Engineer profile not found");
    }

    const participation = await this.prisma.taskParticipation.findUnique({
      where: {
        taskId_engineerProfileId: {
          taskId,
          engineerProfileId: user.engineerProfile.id,
        },
      },
    });

    if (!participation) {
      throw new Error("Must participate before submitting");
    }

    const submission = await this.prisma.taskSubmission.create({
      data: {
        taskId,
        userId,
        engineerProfileId: user.engineerProfile.id,
        description: data.description,
        demoUrl: data.demoUrl,
        githubUrl: data.githubUrl,
        codeUrl: data.codeUrl,
        screenshots: data.screenshots || [],
        videoUrl: data.videoUrl,
        performanceMetrics: data.performanceMetrics
          ? (data.performanceMetrics as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        architectureDiagram: data.architectureDiagram,
        status: SubmissionStatus.pending,
      },
    });

    await this.prisma.task.update({
      where: { id: taskId },
      data: {
        submissionCount: { increment: 1 },
        status: TaskStatus.in_review,
      },
    });

    return submission;
  }

  async evaluateSubmission(
    submissionId: string,
    userId: string,
    data: EvaluateSubmissionInput,
  ) {
    const submission = await this.prisma.taskSubmission.findUnique({
      where: { id: submissionId },
      include: { task: true },
    });

    if (!submission) {
      throw new Error("Submission not found");
    }

    if (submission.task.userId !== userId) {
      throw new Error("Unauthorized - only task creator can evaluate");
    }

    return await this.prisma.taskSubmission.update({
      where: { id: submissionId },
      data: {
        status: SubmissionStatus.under_review,
        score: data.score,
        feedback: data.feedback,
        criteriaScores: data.criteriaScores
          ? (data.criteriaScores as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        reviewedAt: new Date(),
      },
    });
  }

  async selectWinner(taskId: string, userId: string, data: SelectWinnerInput) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { submissions: true },
    });

    if (!task) {
      throw new Error("Task not found");
    }

    if (task.userId !== userId) {
      throw new Error("Unauthorized");
    }

    if (!task.escrowDeposited) {
      throw new Error("Escrow not deposited");
    }

    const submission = await this.prisma.taskSubmission.findUnique({
      where: { id: data.submissionId },
      include: { engineerProfile: true },
    });

    if (!submission || submission.taskId !== taskId) {
      throw new Error("Submission not found");
    }

    if (!submission.engineerProfile.upiId) {
      throw new Error("Engineer UPI ID not configured");
    }

    const payout = await this.escrowService.releaseEscrow(
      taskId,
      submission.engineerProfile.upiId,
      parseFloat(task.rewardAmount.toString()),
      task.currency,
    );

    await this.prisma.taskSubmission.update({
      where: { id: data.submissionId },
      data: {
        isWinner: true,
        status: SubmissionStatus.winner,
        payoutAmount: task.rewardAmount,
        payoutStatus: "processing",
        payoutId: payout.payoutId,
        rank: data.rank || 1,
      },
    });

    await this.prisma.task.update({
      where: { id: taskId },
      data: {
        status: TaskStatus.completed,
        completedAt: new Date(),
      },
    });

    return { success: true, payoutId: payout.payoutId };
  }

  async selectMultipleWinners(
    taskId: string,
    userId: string,
    data: SelectMultipleWinnersInput,
  ) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new Error("Task not found");
    }

    if (task.userId !== userId) {
      throw new Error("Unauthorized");
    }

    if (!task.isContest) {
      throw new Error("Task is not a contest");
    }

    if (!task.escrowDeposited) {
      throw new Error("Escrow not deposited");
    }

    if (!task.contestRanks) {
      throw new Error("Contest ranks not configured");
    }

    if (data.winners.length > (task.maxWinners || 1)) {
      throw new Error(`Maximum ${task.maxWinners} winners allowed`);
    }

    const contestRanks = task.contestRanks as Array<{
      rank: number;
      percentage: number;
    }>;
    const totalReward = parseFloat(task.rewardAmount.toString());

    const payouts = await Promise.all(
      data.winners.map(
        async (winner: { submissionId: string; rank: number }) => {
          const submission = await this.prisma.taskSubmission.findUnique({
            where: { id: winner.submissionId },
            include: { engineerProfile: true },
          });

          if (!submission || submission.taskId !== taskId) {
            throw new Error(`Submission ${winner.submissionId} not found`);
          }

          if (!submission.engineerProfile.upiId) {
            throw new Error(
              `Engineer ${submission.engineerProfile.fullName} UPI ID not configured`,
            );
          }

          const rankConfig = contestRanks.find((r) => r.rank === winner.rank);
          if (!rankConfig) {
            throw new Error(`Rank ${winner.rank} not configured`);
          }

          const payoutAmount = (totalReward * rankConfig.percentage) / 100;

          return {
            engineerUpiId: submission.engineerProfile.upiId,
            amount: payoutAmount,
            rank: winner.rank,
            submissionId: winner.submissionId,
          };
        },
      ),
    );

    const payoutResults = await this.escrowService.releaseEscrowMultiple(
      taskId,
      payouts,
      task.currency,
    );

    await Promise.all(
      payouts.map(
        async (
          payout: {
            engineerUpiId: string;
            amount: number;
            rank: number;
            submissionId: string;
          },
          index: number,
        ) => {
          const payoutResult = payoutResults[index];

          await this.prisma.taskSubmission.update({
            where: { id: payout.submissionId },
            data: {
              isWinner: true,
              status: SubmissionStatus.winner,
              rank: payout.rank,
              payoutAmount: payout.amount,
              payoutStatus:
                payoutResult.status === "failed" ? "failed" : "processing",
              payoutId: payoutResult.payoutId,
            },
          });
        },
      ),
    );

    await this.prisma.task.update({
      where: { id: taskId },
      data: {
        status: TaskStatus.completed,
        completedAt: new Date(),
      },
    });

    return { success: true, payouts: payoutResults };
  }

  async askQuestion(taskId: string, userId: string, data: AskQuestionInput) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new Error("Task not found");
    }

    if (
      task.status !== TaskStatus.open &&
      task.status !== TaskStatus.in_progress
    ) {
      throw new Error("Task is not accepting questions");
    }

    return await this.prisma.taskQuestion.create({
      data: {
        taskId,
        userId,
        question: data.question,
        isPublic: data.isPublic,
      },
    });
  }

  async answerQuestion(
    questionId: string,
    userId: string,
    data: AnswerQuestionInput,
  ) {
    const question = await this.prisma.taskQuestion.findUnique({
      where: { id: questionId },
      include: { task: true },
    });

    if (!question) {
      throw new Error("Question not found");
    }

    if (question.task.userId !== userId) {
      throw new Error("Unauthorized - only task creator can answer");
    }

    return await this.prisma.taskQuestion.update({
      where: { id: questionId },
      data: {
        answer: data.answer,
        answeredBy: userId,
        answeredAt: new Date(),
      },
    });
  }

  async generateNDA(taskId: string, userId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { companyProfile: true },
    });

    if (!task) {
      throw new Error("Task not found");
    }

    if (!task.ndaRequired) {
      throw new Error("NDA not required for this task");
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { engineerProfile: true },
    });

    if (!user || !user.engineerProfile) {
      throw new Error("Engineer profile not found");
    }

    const existing = await this.prisma.taskNDASignature.findUnique({
      where: {
        taskId_engineerProfileId: {
          taskId,
          engineerProfileId: user.engineerProfile.id,
        },
      },
    });

    if (existing) {
      return existing;
    }

    const ndaPdfUrl = await this.ndaService.generateNDA({
      taskId,
      taskTitle: task.title,
      companyName: task.companyProfile.companyName,
      engineerName: user.engineerProfile.fullName,
      engineerEmail: user.email,
      date: new Date(),
    });

    return await this.prisma.taskNDASignature.create({
      data: {
        taskId,
        userId,
        engineerProfileId: user.engineerProfile.id,
        ndaPdfUrl,
        ipAddress: "0.0.0.0",
      },
    });
  }

  async signNDA(taskId: string, userId: string, data: SignNDAInput) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { engineerProfile: true },
    });

    if (!user || !user.engineerProfile) {
      throw new Error("Engineer profile not found");
    }

    const ndaSignature = await this.prisma.taskNDASignature.findUnique({
      where: {
        taskId_engineerProfileId: {
          taskId,
          engineerProfileId: user.engineerProfile.id,
        },
      },
      include: {
        task: {
          include: { companyProfile: true },
        },
      },
    });

    if (!ndaSignature) {
      throw new Error("NDA not found");
    }

    if (ndaSignature.signed) {
      throw new Error("NDA already signed");
    }

    const signedPdfUrl = await this.ndaService.generateSignedNDA(
      ndaSignature.ndaPdfUrl,
      data.signature,
      data.ipAddress,
      {
        taskId,
        taskTitle: ndaSignature.task.title,
        companyName: ndaSignature.task.companyProfile.companyName,
        engineerName: user.engineerProfile.fullName,
        engineerEmail: user.email,
        date: new Date(),
      },
    );

    return await this.prisma.taskNDASignature.update({
      where: {
        taskId_engineerProfileId: {
          taskId,
          engineerProfileId: user.engineerProfile.id,
        },
      },
      data: {
        signed: true,
        signedAt: new Date(),
        signedPdfUrl,
        signature: data.signature,
        ipAddress: data.ipAddress,
      },
    });
  }

  /**
   * Engineer's bounty participations and submissions
   */
  async getEngineerSubmissions(userId: string) {
    const profile = await this.prisma.engineerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      return [];
    }

    const submissions = await this.prisma.taskSubmission.findMany({
      where: { engineerProfileId: profile.id },
      orderBy: { submittedAt: "desc" },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            rewardAmount: true,
            status: true,
            type: true,
            companyProfile: { select: { companyName: true } },
          },
        },
      },
    });

    return submissions.map((s) => ({
      id: s.id,
      taskId: s.taskId,
      taskTitle: s.task.title,
      companyName: s.task.companyProfile.companyName,
      reward: Number(s.task.rewardAmount),
      taskStatus: s.task.status,
      taskType: s.task.type,
      status: s.isWinner
        ? "winner"
        : s.status === "accepted"
          ? "accepted"
          : s.status === "rejected"
            ? "rejected"
            : "pending",
      submittedAt: s.submittedAt,
      payoutAmount: s.payoutAmount ? Number(s.payoutAmount) : null,
      score: s.score,
    }));
  }
}
