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
import { getRedisClient } from "../config/redis";
import {
  CreateTaskInput,
  UpdateTaskInput,
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

  private async invalidateDashboardCaches(
    companyProfileId?: string | null,
    engineerProfileIds: string[] = [],
  ) {
    try {
      const redis = getRedisClient();
      const keys: string[] = [];
      if (companyProfileId) keys.push(`dashboard:company:${companyProfileId}`);
      for (const id of engineerProfileIds) {
        if (id) keys.push(`dashboard:engineer:v2:${id}`);
      }
      if (keys.length > 0) await redis.del(...keys);
    } catch {
      // Best-effort cache invalidation.
    }
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
    await this.invalidateDashboardCaches(user.companyProfile.id);
    return task;
  }

  async updateTask(taskId: string, userId: string, data: UpdateTaskInput) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });
    if (!task) {
      throw new Error("Task not found");
    }
    if (task.userId !== userId) {
      throw new Error("Unauthorized");
    }
    if (task.status === TaskStatus.completed || task.status === TaskStatus.cancelled) {
      throw new Error("Completed or cancelled tasks cannot be updated");
    }

    const updateData: Prisma.TaskUpdateInput = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.problemStatement !== undefined) updateData.problemStatement = data.problemStatement;
    if (data.currentState !== undefined) updateData.currentState = data.currentState ?? null;
    if (data.expectedOutcome !== undefined) updateData.expectedOutcome = data.expectedOutcome;
    if (data.deliverables !== undefined) {
      updateData.deliverables = data.deliverables as unknown as Prisma.InputJsonValue;
    }
    if (data.techRequirements !== undefined) updateData.techRequirements = data.techRequirements;
    if (data.timeline !== undefined) {
      updateData.timeline = data.timeline;
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + data.timeline);
      updateData.deadline = deadline;
    }
    if (data.rewardAmount !== undefined) updateData.rewardAmount = data.rewardAmount;
    if (data.paymentType !== undefined) updateData.paymentType = data.paymentType;
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.selectionCriteria !== undefined) {
      updateData.selectionCriteria =
        data.selectionCriteria as unknown as Prisma.InputJsonValue;
    }
    if (data.minNeuronScore !== undefined) updateData.minNeuronScore = data.minNeuronScore;
    if (data.ndaRequired !== undefined) updateData.ndaRequired = data.ndaRequired;
    if (data.difficulty !== undefined) updateData.difficulty = data.difficulty;
    if (data.isContest !== undefined) updateData.isContest = data.isContest;
    if (data.contestRanks !== undefined) {
      updateData.contestRanks = data.contestRanks
        ? (data.contestRanks as unknown as Prisma.InputJsonValue)
        : Prisma.JsonNull;
    }
    if (data.maxWinners !== undefined) updateData.maxWinners = data.maxWinners;

    updateData.aiEnriched = false;
    updateData.autoTaggedSkills = [];
    updateData.vagueDeliverables = [];
    updateData.aiSuggestions = Prisma.JsonNull;
    updateData.postingQuality = null;
    updateData.estimatedTimeline = null;
    updateData.suggestedReward = Prisma.JsonNull;
    updateData.recommendedType = null;

    const updatedTask = await this.prisma.task.update({
      where: { id: taskId },
      data: updateData,
    });

    await this.enrichmentService.queueEnrichment(taskId, {
      title: updatedTask.title,
      type: updatedTask.type,
      category: updatedTask.category,
      problemStatement: updatedTask.problemStatement,
      currentState: updatedTask.currentState,
      expectedOutcome: updatedTask.expectedOutcome,
      deliverables: updatedTask.deliverables as any[],
      techRequirements: updatedTask.techRequirements,
      timeline: updatedTask.timeline,
      rewardAmount: Number(updatedTask.rewardAmount),
      paymentType: updatedTask.paymentType,
      currency: updatedTask.currency,
      selectionCriteria: updatedTask.selectionCriteria as any[],
      minNeuronScore: updatedTask.minNeuronScore,
      ndaRequired: updatedTask.ndaRequired,
      difficulty: updatedTask.difficulty,
      isContest: updatedTask.isContest,
      contestRanks: updatedTask.contestRanks as any[] | null,
      maxWinners: updatedTask.maxWinners,
    });

    await this.invalidateDashboardCaches(task.companyProfileId);
    return updatedTask;
  }

  async closeTask(taskId: string, userId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });
    if (!task) {
      throw new Error("Task not found");
    }
    if (task.userId !== userId) {
      throw new Error("Unauthorized");
    }
    if (task.status === TaskStatus.completed) {
      throw new Error("Completed task cannot be closed");
    }
    if (task.status === TaskStatus.cancelled) {
      return task;
    }

    const updated = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        status: TaskStatus.cancelled,
        completedAt: new Date(),
      },
    });
    await this.invalidateDashboardCaches(task.companyProfileId);
    return updated;
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

    const canViewParticipantDetails = Boolean(userId && task.userId === userId);
    const sanitizedParticipations = canViewParticipantDetails
      ? task.participations
      : [];

    let hasParticipated = false;
    let hasSignedNda = !task.ndaRequired;
    if (userId) {
      const engineerProfile = await this.prisma.engineerProfile.findUnique({
        where: { userId },
      });

      if (engineerProfile) {
        const participation = await this.prisma.taskParticipation.findUnique({
          where: {
            taskId_engineerProfileId: {
              taskId,
              engineerProfileId: engineerProfile.id,
            },
          },
        });
        hasParticipated = Boolean(participation);

        if (task.ndaRequired) {
          const ndaSignature = await this.prisma.taskNDASignature.findUnique({
            where: {
              taskId_engineerProfileId: {
                taskId,
                engineerProfileId: engineerProfile.id,
              },
            },
          });
          hasSignedNda = Boolean(ndaSignature?.signed);
        }
      }
    }

    await this.prisma.task.update({
      where: { id: taskId },
      data: { viewCount: { increment: 1 } },
    });

    if (task.ndaRequired && userId && !hasSignedNda) {
      return {
        ...task,
        participations: sanitizedParticipations,
        problemStatement: "NDA required - sign to view full details",
        currentState: null,
        deliverables: [],
        selectionCriteria: [],
        hasParticipated,
        hasSignedNda,
      };
    }

    return {
      ...task,
      participations: sanitizedParticipations,
      hasParticipated,
      hasSignedNda,
    };
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
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const passedMiniGate = await this.prisma.miniGateTest.findFirst({
        where: {
          engineerProfileId: user.engineerProfile.id,
          taskId,
          passed: true,
          submittedAt: { gte: twentyFourHoursAgo },
        },
        orderBy: { submittedAt: "desc" },
      });
      if (!passedMiniGate) {
        throw new Error(
          `NeuronScore ${user.engineerProfile.neuronScore} is below minimum required ${task.minNeuronScore}. Take and pass a mini-gate test to qualify.`,
        );
      }
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

    await this.invalidateDashboardCaches(task.companyProfileId, [
      user.engineerProfile.id,
    ]);
    return participation;
  }

  async approveParticipation(taskId: string, participationId: string, userId: string) {
    const participation = await this.prisma.taskParticipation.findUnique({
      where: { id: participationId },
      include: { task: true },
    });
    if (!participation || participation.taskId !== taskId) {
      throw new Error("Participation not found");
    }
    if (participation.task.userId !== userId) {
      throw new Error("Unauthorized");
    }
    if (
      participation.task.status === TaskStatus.completed ||
      participation.task.status === TaskStatus.cancelled
    ) {
      throw new Error("Cannot update participants for finalized task");
    }
    if (participation.approved) {
      throw new Error("Participant already approved");
    }
    if (participation.rejected) {
      throw new Error("Rejected participant cannot be approved");
    }

    const updated = await this.prisma.taskParticipation.update({
      where: { id: participationId },
      data: {
        approved: true,
        rejected: false,
        rejectionReason: null,
      },
    });
    await this.invalidateDashboardCaches(participation.task.companyProfileId, [
      participation.engineerProfileId,
    ]);
    return updated;
  }

  async rejectParticipation(
    taskId: string,
    participationId: string,
    userId: string,
    rejectionReason?: string | null,
  ) {
    const participation = await this.prisma.taskParticipation.findUnique({
      where: { id: participationId },
      include: { task: true },
    });
    if (!participation || participation.taskId !== taskId) {
      throw new Error("Participation not found");
    }
    if (participation.task.userId !== userId) {
      throw new Error("Unauthorized");
    }
    if (
      participation.task.status === TaskStatus.completed ||
      participation.task.status === TaskStatus.cancelled
    ) {
      throw new Error("Cannot update participants for finalized task");
    }
    if (participation.rejected) {
      throw new Error("Participant already rejected");
    }
    if (participation.approved) {
      throw new Error("Approved participant cannot be rejected");
    }

    const updated = await this.prisma.taskParticipation.update({
      where: { id: participationId },
      data: {
        approved: false,
        rejected: true,
        rejectionReason: rejectionReason?.trim() || null,
      },
    });
    await this.invalidateDashboardCaches(participation.task.companyProfileId, [
      participation.engineerProfileId,
    ]);
    return updated;
  }

  async startMiniGateTest(taskId: string, userId: string) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new Error("Task not found");

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { engineerProfile: true },
    });
    if (!user?.engineerProfile) throw new Error("Engineer profile not found");

    const previousFailed = await this.prisma.miniGateTest.findFirst({
      where: {
        engineerProfileId: user.engineerProfile.id,
        taskId,
        passed: false,
        submittedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      orderBy: { submittedAt: "desc" },
    });
    if (previousFailed) {
      throw new Error("You can retake this mini-gate test after 24 hours");
    }

    return this.prisma.miniGateTest.create({
      data: {
        engineerProfileId: user.engineerProfile.id,
        taskId,
        domain: (task.category?.[0] as string | undefined) ?? "general",
        questions: [],
      },
    });
  }

  async submitMiniGateTest(
    taskId: string,
    userId: string,
    data: { testId: string; answers: Array<{ questionId: string; selectedOption: number }> },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { engineerProfile: true },
    });
    if (!user?.engineerProfile) throw new Error("Engineer profile not found");

    const test = await this.prisma.miniGateTest.findUnique({
      where: { id: data.testId },
    });
    if (!test || test.taskId !== taskId || test.engineerProfileId !== user.engineerProfile.id) {
      throw new Error("Mini-gate test session not found");
    }
    if (test.submittedAt) {
      throw new Error("Mini-gate test already submitted");
    }

    const questions = Array.isArray(test.questions) ? (test.questions as Array<{ id: string; correctAnswer?: number }>) : [];
    const answerMap = new Map(data.answers.map((a) => [a.questionId, a.selectedOption]));
    const correct = questions.filter((q) => {
      const selected = answerMap.get(q.id);
      return typeof q.correctAnswer === "number" && selected === q.correctAnswer;
    }).length;
    const score = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;
    const passed = score >= 60;

    const updated = await this.prisma.miniGateTest.update({
      where: { id: test.id },
      data: {
        responses: data.answers as unknown as Prisma.InputJsonValue,
        score,
        passed,
        submittedAt: new Date(),
      },
    });

    return {
      id: updated.id,
      score,
      passed,
      retakeAfterHours: passed ? 0 : 24,
    };
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

    const existingSubmission = await this.prisma.taskSubmission.findFirst({
      where: {
        taskId,
        engineerProfileId: user.engineerProfile.id,
      },
      select: { id: true, status: true },
    });
    if (existingSubmission) {
      throw new Error(
        `Submission already exists for this task (status: ${existingSubmission.status})`,
      );
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

    await this.invalidateDashboardCaches(task.companyProfileId, [
      user.engineerProfile.id,
    ]);
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
    if (
      submission.status === SubmissionStatus.accepted ||
      submission.status === SubmissionStatus.rejected ||
      submission.status === SubmissionStatus.winner
    ) {
      throw new Error(
        `Cannot evaluate finalized submission with status: ${submission.status}`,
      );
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
    if (task.status === TaskStatus.completed || task.status === TaskStatus.cancelled) {
      throw new Error("Task is already finalized");
    }

    const submission = await this.prisma.taskSubmission.findUnique({
      where: { id: data.submissionId },
      include: { engineerProfile: true },
    });

    if (!submission || submission.taskId !== taskId) {
      throw new Error("Submission not found");
    }
    if (submission.status === SubmissionStatus.rejected) {
      throw new Error("Rejected submissions cannot be selected as winner");
    }
    if (submission.status === SubmissionStatus.winner || submission.isWinner) {
      throw new Error("Submission is already marked as winner");
    }

    const existingWinner = await this.prisma.taskSubmission.findFirst({
      where: { taskId, isWinner: true },
      select: { id: true },
    });
    if (existingWinner) {
      throw new Error("Winner already selected for this task");
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

    await this.invalidateDashboardCaches(task.companyProfileId, [
      submission.engineerProfileId,
    ]);
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
    if (task.status === TaskStatus.completed || task.status === TaskStatus.cancelled) {
      throw new Error("Task is already finalized");
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
    const submissionIds = data.winners.map((winner) => winner.submissionId);
    if (new Set(submissionIds).size !== submissionIds.length) {
      throw new Error("Duplicate submission in winners payload");
    }
    const ranks = data.winners.map((winner) => winner.rank);
    if (new Set(ranks).size !== ranks.length) {
      throw new Error("Duplicate rank in winners payload");
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
          if (submission.status === SubmissionStatus.rejected) {
            throw new Error(`Submission ${winner.submissionId} is rejected`);
          }
          if (submission.status === SubmissionStatus.winner || submission.isWinner) {
            throw new Error(`Submission ${winner.submissionId} is already winner`);
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
            engineerProfileId: submission.engineerProfile.id,
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
            engineerProfileId: string;
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

    await this.invalidateDashboardCaches(
      task.companyProfileId,
      payouts.map((p) => p.engineerProfileId),
    );
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

    const [submissions, participations] = await Promise.all([
      this.prisma.taskSubmission.findMany({
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
      }),
      this.prisma.taskParticipation.findMany({
        where: { engineerProfileId: profile.id },
        orderBy: { createdAt: "desc" },
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
      }),
    ]);

    const submissionItems = submissions.map((s) => ({
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

    const submittedTaskIds = new Set(submissionItems.map((item) => item.taskId));
    const participationItems = participations
      .filter((p) => !submittedTaskIds.has(p.taskId))
      .map((p) => ({
        id: p.id,
        taskId: p.taskId,
        taskTitle: p.task.title,
        companyName: p.task.companyProfile.companyName,
        reward: Number(p.task.rewardAmount),
        taskStatus: p.task.status,
        taskType: p.task.type,
        status: "participating",
        submittedAt: p.createdAt,
        payoutAmount: null,
        score: null,
      }));

    return [...submissionItems, ...participationItems].sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
    );
  }
}
