import { TaskService } from "../../services/task.service";
import { PrismaClient, SubmissionStatus, TaskStatus, UserRole } from "@prisma/client";
import { hasTestDatabase } from "../db-test-flag";

// Mock dependencies
jest.mock("../../services/razorpay-escrow.service");
jest.mock("../../services/task-ai-enrichment.service");
jest.mock("../../services/nda-generator.service");

const describeOrSkip = hasTestDatabase() ? describe : describe.skip;

describeOrSkip("TaskService", () => {
  let taskService: TaskService;
  let prisma: PrismaClient;

  beforeAll(() => {
    taskService = new TaskService();
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("NeuronScore Gate Check", () => {
    it("should block participation if NeuronScore below minimum", async () => {
      // Create test company and task
      const company = await prisma.user.create({
        include: { companyProfile: true, engineerProfile: true },
        data: {
          clerkId: "clerk_test_company_1",
          email: "company1@test.com",
          role: UserRole.company,
          companyProfile: {
            create: {
              companyName: "Test Company",
              trustScore: 80,
            },
          },
        },
      });

      const task = await prisma.task.create({
        data: {
          userId: company.id,
          companyProfileId: company.companyProfile!.id,
          title: "High-level AI Task",
          type: "bounty",
          category: ["AI", "ML"],
          problemStatement:
            "Build an advanced ML model with high accuracy requirements",
          expectedOutcome: "A production-ready ML model",
          deliverables: [{ title: "Model", description: "Trained model" }],
          techRequirements: ["Python", "TensorFlow"],
          timeline: 30,
          rewardAmount: 50000,
          paymentType: "fixed",
          selectionCriteria: [{ name: "Quality", weight: 100 }],
          minNeuronScore: 600, // High threshold
          difficulty: "expert",
          status: TaskStatus.open,
          escrowDeposited: true,
        },
      });

      // Create engineer with low NeuronScore
      const engineer = await prisma.user.create({
        include: { companyProfile: true, engineerProfile: true },
        data: {
          clerkId: "clerk_test_engineer_1",
          email: "engineer1@test.com",
          role: UserRole.engineer,
          engineerProfile: {
            create: {
              fullName: "Test Engineer",
              neuronScore: 400, // Below threshold
              completenessScore: 80,
            },
          },
        },
      });

      // Attempt to participate
      await expect(
        taskService.participateInTask(task.id, engineer.id, {
          approach: "I will build this using TensorFlow and Python",
          estimatedTime: 25,
        }),
      ).rejects.toThrow(/NeuronScore.*below minimum/);

      // Cleanup
      await prisma.task.delete({ where: { id: task.id } });
      await prisma.user.delete({ where: { id: company.id } });
      await prisma.user.delete({ where: { id: engineer.id } });
    });

    it("should allow participation if NeuronScore meets minimum", async () => {
      // Create test company and task
      const company = await prisma.user.create({
        include: { companyProfile: true, engineerProfile: true },
        data: {
          clerkId: "clerk_test_company_2",
          email: "company2@test.com",
          role: UserRole.company,
          companyProfile: {
            create: {
              companyName: "Test Company 2",
              trustScore: 80,
            },
          },
        },
      });

      const task = await prisma.task.create({
        data: {
          userId: company.id,
          companyProfileId: company.companyProfile!.id,
          title: "Mid-level AI Task",
          type: "bounty",
          category: ["AI"],
          problemStatement: "Build a simple ML model",
          expectedOutcome: "A working ML model",
          deliverables: [{ title: "Model", description: "Trained model" }],
          techRequirements: ["Python"],
          timeline: 15,
          rewardAmount: 20000,
          paymentType: "fixed",
          selectionCriteria: [{ name: "Quality", weight: 100 }],
          minNeuronScore: 400,
          difficulty: "medium",
          status: TaskStatus.open,
          escrowDeposited: true,
        },
      });

      // Create engineer with sufficient NeuronScore
      const engineer = await prisma.user.create({
        include: { companyProfile: true, engineerProfile: true },
        data: {
          clerkId: "clerk_test_engineer_2",
          email: "engineer2@test.com",
          role: UserRole.engineer,
          engineerProfile: {
            create: {
              fullName: "Test Engineer 2",
              neuronScore: 500, // Above threshold
              completenessScore: 80,
            },
          },
        },
      });

      // Participate successfully
      const participation = await taskService.participateInTask(
        task.id,
        engineer.id,
        {
          approach: "I will build this using Python and scikit-learn",
          estimatedTime: 12,
        },
      );

      expect(participation).toBeDefined();
      expect(participation.taskId).toBe(task.id);
      expect(participation.engineerProfileId).toBe(
        engineer.engineerProfile!.id,
      );

      // Cleanup
      await prisma.task.delete({ where: { id: task.id } });
      await prisma.user.delete({ where: { id: company.id } });
      await prisma.user.delete({ where: { id: engineer.id } });
    });
  });

  describe("Escrow Pre-condition Enforcement", () => {
    it("should prevent task from going live without escrow deposit", async () => {
      // Create test company
      const company = await prisma.user.create({
        include: { companyProfile: true, engineerProfile: true },
        data: {
          clerkId: "clerk_test_company_3",
          email: "company3@test.com",
          role: UserRole.company,
          companyProfile: {
            create: {
              companyName: "Test Company 3",
              trustScore: 80,
            },
          },
        },
      });

      // Create task in draft state
      const task = await prisma.task.create({
        data: {
          userId: company.id,
          companyProfileId: company.companyProfile!.id,
          title: "Test Task",
          type: "bounty",
          category: ["AI"],
          problemStatement: "Build something",
          expectedOutcome: "A working solution",
          deliverables: [{ title: "Solution", description: "Working code" }],
          techRequirements: ["Python"],
          timeline: 10,
          rewardAmount: 15000,
          paymentType: "fixed",
          selectionCriteria: [{ name: "Quality", weight: 100 }],
          difficulty: "medium",
          status: TaskStatus.draft, // Draft state
          escrowDeposited: false, // No escrow
        },
      });

      // Verify task is not open
      expect(task.status).toBe(TaskStatus.draft);
      expect(task.escrowDeposited).toBe(false);

      // Create engineer
      const engineer = await prisma.user.create({
        include: { companyProfile: true, engineerProfile: true },
        data: {
          clerkId: "clerk_test_engineer_3",
          email: "engineer3@test.com",
          role: UserRole.engineer,
          engineerProfile: {
            create: {
              fullName: "Test Engineer 3",
              neuronScore: 500,
              completenessScore: 80,
            },
          },
        },
      });

      // Attempt to participate should fail
      await expect(
        taskService.participateInTask(task.id, engineer.id, {
          approach: "My approach",
          estimatedTime: 8,
        }),
      ).rejects.toThrow(/not open for participation/);

      // Cleanup
      await prisma.task.delete({ where: { id: task.id } });
      await prisma.user.delete({ where: { id: company.id } });
      await prisma.user.delete({ where: { id: engineer.id } });
    });

    it("should allow task to go live after escrow deposit", async () => {
      // Create test company
      const company = await prisma.user.create({
        include: { companyProfile: true, engineerProfile: true },
        data: {
          clerkId: "clerk_test_company_4",
          email: "company4@test.com",
          role: UserRole.company,
          companyProfile: {
            create: {
              companyName: "Test Company 4",
              trustScore: 80,
            },
          },
        },
      });

      // Create task with escrow deposited
      const task = await prisma.task.create({
        data: {
          userId: company.id,
          companyProfileId: company.companyProfile!.id,
          title: "Test Task with Escrow",
          type: "bounty",
          category: ["AI"],
          problemStatement: "Build something",
          expectedOutcome: "A working solution",
          deliverables: [{ title: "Solution", description: "Working code" }],
          techRequirements: ["Python"],
          timeline: 10,
          rewardAmount: 15000,
          paymentType: "fixed",
          selectionCriteria: [{ name: "Quality", weight: 100 }],
          difficulty: "medium",
          status: TaskStatus.open, // Open state
          escrowDeposited: true, // Escrow deposited
          escrowId: "order_test123",
          escrowAmount: 15000,
          publishedAt: new Date(),
        },
      });

      // Verify task is open
      expect(task.status).toBe(TaskStatus.open);
      expect(task.escrowDeposited).toBe(true);
      expect(task.publishedAt).toBeDefined();

      // Cleanup
      await prisma.task.delete({ where: { id: task.id } });
      await prisma.user.delete({ where: { id: company.id } });
    });
  });

  describe("Contest Ranked Payout", () => {
    it("should split payout correctly for contest winners", () => {
      const totalReward = 100000;
      const contestRanks = [
        { rank: 1, percentage: 50 },
        { rank: 2, percentage: 30 },
        { rank: 3, percentage: 20 },
      ];

      // Calculate payouts
      const payouts = contestRanks.map((rank) => ({
        rank: rank.rank,
        amount: (totalReward * rank.percentage) / 100,
      }));

      expect(payouts[0].amount).toBe(50000); // 1st place
      expect(payouts[1].amount).toBe(30000); // 2nd place
      expect(payouts[2].amount).toBe(20000); // 3rd place

      // Verify total
      const total = payouts.reduce((sum, p) => sum + p.amount, 0);
      expect(total).toBe(totalReward);
    });

    it("should validate contest rank percentages sum to 100", () => {
      const validRanks = [
        { rank: 1, percentage: 60 },
        { rank: 2, percentage: 40 },
      ];

      const invalidRanks = [
        { rank: 1, percentage: 60 },
        { rank: 2, percentage: 30 }, // Only 90%
      ];

      const validTotal = validRanks.reduce((sum, r) => sum + r.percentage, 0);
      const invalidTotal = invalidRanks.reduce(
        (sum, r) => sum + r.percentage,
        0,
      );

      expect(validTotal).toBe(100);
      expect(invalidTotal).not.toBe(100);
    });
  });

  describe("Submission Finalization Guards", () => {
    async function createSubmissionWithStatus(status: SubmissionStatus) {
      const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      const company = await prisma.user.create({
        include: { companyProfile: true, engineerProfile: true },
        data: {
          clerkId: `clerk_test_company_guard_${suffix}`,
          email: `company_guard_${suffix}@test.com`,
          role: UserRole.company,
          companyProfile: {
            create: {
              companyName: `Guard Test Company ${suffix}`,
              trustScore: 82,
            },
          },
        },
      });

      const engineer = await prisma.user.create({
        include: { companyProfile: true, engineerProfile: true },
        data: {
          clerkId: `clerk_test_engineer_guard_${suffix}`,
          email: `engineer_guard_${suffix}@test.com`,
          role: UserRole.engineer,
          engineerProfile: {
            create: {
              fullName: `Guard Engineer ${suffix}`,
              neuronScore: 700,
              completenessScore: 90,
            },
          },
        },
      });

      const task = await prisma.task.create({
        data: {
          userId: company.id,
          companyProfileId: company.companyProfile!.id,
          title: `Submission guard task ${suffix}`,
          type: "bounty",
          category: ["AI"],
          problemStatement: "Guard state transitions for submission decisions",
          expectedOutcome: "State transitions are blocked correctly",
          deliverables: [{ title: "Tests", description: "Guard transition tests" }],
          techRequirements: ["TypeScript"],
          timeline: 7,
          rewardAmount: 10000,
          paymentType: "fixed",
          selectionCriteria: [{ name: "Correctness", weight: 100 }],
          difficulty: "easy",
          status: TaskStatus.in_review,
          escrowDeposited: true,
        },
      });

      const submission = await prisma.taskSubmission.create({
        data: {
          taskId: task.id,
          userId: engineer.id,
          engineerProfileId: engineer.engineerProfile!.id,
          description: "Initial submission",
          status,
        },
      });

      return { company, engineer, task, submission };
    }

    async function cleanupSubmissionFixture(fixture: {
      company: { id: string };
      engineer: { id: string };
      task: { id: string };
      submission: { id: string };
    }) {
      await prisma.taskSubmission
        .delete({ where: { id: fixture.submission.id } })
        .catch(() => {});
      await prisma.task.delete({ where: { id: fixture.task.id } }).catch(() => {});
      await prisma.user.delete({ where: { id: fixture.company.id } }).catch(() => {});
      await prisma.user.delete({ where: { id: fixture.engineer.id } }).catch(() => {});
    }

    it.each([
      SubmissionStatus.accepted,
      SubmissionStatus.rejected,
      SubmissionStatus.winner,
    ])(
      "should block evaluateSubmission for finalized status %s",
      async (finalizedStatus) => {
        const fixture = await createSubmissionWithStatus(finalizedStatus);

        await expect(
          taskService.evaluateSubmission(
            fixture.submission.id,
            fixture.company.id,
            {
              submissionId: fixture.submission.id,
              score: 88,
              feedback: "Re-evaluation attempt",
            },
          ),
        ).rejects.toThrow(
          `Cannot evaluate finalized submission with status: ${finalizedStatus}`,
        );

        await cleanupSubmissionFixture(fixture);
      },
    );
  });

  describe("Winner Selection Guards", () => {
    async function createWinnerSelectionFixture() {
      const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      const company = await prisma.user.create({
        include: { companyProfile: true },
        data: {
          clerkId: `clerk_test_company_winner_${suffix}`,
          email: `company_winner_${suffix}@test.com`,
          role: UserRole.company,
          companyProfile: {
            create: {
              companyName: `Winner Guard Company ${suffix}`,
              trustScore: 85,
            },
          },
        },
      });

      const engineerA = await prisma.user.create({
        include: { engineerProfile: true },
        data: {
          clerkId: `clerk_test_engineer_winner_a_${suffix}`,
          email: `engineer_winner_a_${suffix}@test.com`,
          role: UserRole.engineer,
          engineerProfile: {
            create: {
              fullName: `Winner Guard Engineer A ${suffix}`,
              neuronScore: 740,
              completenessScore: 91,
              upiId: "winner-a@upi",
            },
          },
        },
      });

      const engineerB = await prisma.user.create({
        include: { engineerProfile: true },
        data: {
          clerkId: `clerk_test_engineer_winner_b_${suffix}`,
          email: `engineer_winner_b_${suffix}@test.com`,
          role: UserRole.engineer,
          engineerProfile: {
            create: {
              fullName: `Winner Guard Engineer B ${suffix}`,
              neuronScore: 760,
              completenessScore: 93,
              upiId: "winner-b@upi",
            },
          },
        },
      });

      const task = await prisma.task.create({
        data: {
          userId: company.id,
          companyProfileId: company.companyProfile!.id,
          title: `Winner guard task ${suffix}`,
          type: "bounty",
          category: ["AI"],
          problemStatement: "Validate winner selection transitions",
          expectedOutcome: "Winner selection guard coverage",
          deliverables: [{ title: "Guard tests", description: "No invalid winner transitions" }],
          techRequirements: ["TypeScript"],
          timeline: 10,
          rewardAmount: 25000,
          paymentType: "fixed",
          selectionCriteria: [{ name: "Quality", weight: 100 }],
          difficulty: "medium",
          status: TaskStatus.in_review,
          escrowDeposited: true,
        },
      });

      const rejectedSubmission = await prisma.taskSubmission.create({
        data: {
          taskId: task.id,
          userId: engineerA.id,
          engineerProfileId: engineerA.engineerProfile!.id,
          description: "Rejected attempt",
          status: SubmissionStatus.rejected,
        },
      });

      const winnerSubmission = await prisma.taskSubmission.create({
        data: {
          taskId: task.id,
          userId: engineerB.id,
          engineerProfileId: engineerB.engineerProfile!.id,
          description: "Existing winner",
          status: SubmissionStatus.winner,
          isWinner: true,
        },
      });

      const anotherSubmission = await prisma.taskSubmission.create({
        data: {
          taskId: task.id,
          userId: engineerA.id,
          engineerProfileId: engineerA.engineerProfile!.id,
          description: "Another pending submission",
          status: SubmissionStatus.pending,
        },
      });

      return {
        company,
        task,
        engineerA,
        engineerB,
        rejectedSubmission,
        winnerSubmission,
        anotherSubmission,
      };
    }

    async function cleanupWinnerFixture(fixture: {
      company: { id: string };
      task: { id: string };
      engineerA: { id: string };
      engineerB: { id: string };
      rejectedSubmission: { id: string };
      winnerSubmission: { id: string };
      anotherSubmission: { id: string };
    }) {
      await prisma.taskSubmission
        .deleteMany({
          where: {
            id: {
              in: [
                fixture.rejectedSubmission.id,
                fixture.winnerSubmission.id,
                fixture.anotherSubmission.id,
              ],
            },
          },
        })
        .catch(() => {});
      await prisma.task.delete({ where: { id: fixture.task.id } }).catch(() => {});
      await prisma.user.delete({ where: { id: fixture.company.id } }).catch(() => {});
      await prisma.user.delete({ where: { id: fixture.engineerA.id } }).catch(() => {});
      await prisma.user.delete({ where: { id: fixture.engineerB.id } }).catch(() => {});
    }

    it("should reject selecting a rejected submission as winner", async () => {
      const fixture = await createWinnerSelectionFixture();

      await expect(
        taskService.selectWinner(fixture.task.id, fixture.company.id, {
          submissionId: fixture.rejectedSubmission.id,
          rank: 1,
        }),
      ).rejects.toThrow("Rejected submissions cannot be selected as winner");

      await cleanupWinnerFixture(fixture);
    });

    it("should reject selecting another winner when one already exists", async () => {
      const fixture = await createWinnerSelectionFixture();

      await expect(
        taskService.selectWinner(fixture.task.id, fixture.company.id, {
          submissionId: fixture.anotherSubmission.id,
          rank: 1,
        }),
      ).rejects.toThrow("Winner already selected for this task");

      await cleanupWinnerFixture(fixture);
    });
  });

  describe("Multi-winner Selection Guards", () => {
    async function createContestFixture(taskStatus: TaskStatus = TaskStatus.in_review) {
      const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      const company = await prisma.user.create({
        include: { companyProfile: true },
        data: {
          clerkId: `clerk_test_company_contest_${suffix}`,
          email: `company_contest_${suffix}@test.com`,
          role: UserRole.company,
          companyProfile: {
            create: {
              companyName: `Contest Guard Company ${suffix}`,
              trustScore: 87,
            },
          },
        },
      });

      const engineerA = await prisma.user.create({
        include: { engineerProfile: true },
        data: {
          clerkId: `clerk_test_engineer_contest_a_${suffix}`,
          email: `engineer_contest_a_${suffix}@test.com`,
          role: UserRole.engineer,
          engineerProfile: {
            create: {
              fullName: `Contest Engineer A ${suffix}`,
              neuronScore: 810,
              completenessScore: 95,
              upiId: "contest-a@upi",
            },
          },
        },
      });

      const engineerB = await prisma.user.create({
        include: { engineerProfile: true },
        data: {
          clerkId: `clerk_test_engineer_contest_b_${suffix}`,
          email: `engineer_contest_b_${suffix}@test.com`,
          role: UserRole.engineer,
          engineerProfile: {
            create: {
              fullName: `Contest Engineer B ${suffix}`,
              neuronScore: 790,
              completenessScore: 92,
              upiId: "contest-b@upi",
            },
          },
        },
      });

      const task = await prisma.task.create({
        data: {
          userId: company.id,
          companyProfileId: company.companyProfile!.id,
          title: `Contest guard task ${suffix}`,
          type: "bounty",
          category: ["AI"],
          problemStatement: "Validate multi-winner transitions",
          expectedOutcome: "No invalid contest winner selection",
          deliverables: [{ title: "Contest", description: "Multi winner guard tests" }],
          techRequirements: ["TypeScript"],
          timeline: 14,
          rewardAmount: 30000,
          paymentType: "fixed",
          selectionCriteria: [{ name: "Quality", weight: 100 }],
          difficulty: "medium",
          status: taskStatus,
          escrowDeposited: true,
          isContest: true,
          maxWinners: 2,
          contestRanks: [
            { rank: 1, percentage: 60 },
            { rank: 2, percentage: 40 },
          ],
        },
      });

      const submissionA = await prisma.taskSubmission.create({
        data: {
          taskId: task.id,
          userId: engineerA.id,
          engineerProfileId: engineerA.engineerProfile!.id,
          description: "Contest submission A",
          status: SubmissionStatus.pending,
        },
      });

      const submissionB = await prisma.taskSubmission.create({
        data: {
          taskId: task.id,
          userId: engineerB.id,
          engineerProfileId: engineerB.engineerProfile!.id,
          description: "Contest submission B",
          status: SubmissionStatus.pending,
        },
      });

      return { company, engineerA, engineerB, task, submissionA, submissionB };
    }

    async function cleanupContestFixture(fixture: {
      company: { id: string };
      engineerA: { id: string };
      engineerB: { id: string };
      task: { id: string };
      submissionA: { id: string };
      submissionB: { id: string };
    }) {
      await prisma.taskSubmission
        .deleteMany({
          where: { id: { in: [fixture.submissionA.id, fixture.submissionB.id] } },
        })
        .catch(() => {});
      await prisma.task.delete({ where: { id: fixture.task.id } }).catch(() => {});
      await prisma.user.delete({ where: { id: fixture.company.id } }).catch(() => {});
      await prisma.user.delete({ where: { id: fixture.engineerA.id } }).catch(() => {});
      await prisma.user.delete({ where: { id: fixture.engineerB.id } }).catch(() => {});
    }

    it("should reject multi-winner selection for finalized task", async () => {
      const fixture = await createContestFixture(TaskStatus.completed);

      await expect(
        taskService.selectMultipleWinners(fixture.task.id, fixture.company.id, {
          winners: [
            { submissionId: fixture.submissionA.id, rank: 1 },
            { submissionId: fixture.submissionB.id, rank: 2 },
          ],
        }),
      ).rejects.toThrow("Task is already finalized");

      await cleanupContestFixture(fixture);
    });

    it("should reject duplicate submission IDs in winners payload", async () => {
      const fixture = await createContestFixture();

      await expect(
        taskService.selectMultipleWinners(fixture.task.id, fixture.company.id, {
          winners: [
            { submissionId: fixture.submissionA.id, rank: 1 },
            { submissionId: fixture.submissionA.id, rank: 2 },
          ],
        }),
      ).rejects.toThrow("Duplicate submission in winners payload");

      await cleanupContestFixture(fixture);
    });

    it("should reject duplicate ranks in winners payload", async () => {
      const fixture = await createContestFixture();

      await expect(
        taskService.selectMultipleWinners(fixture.task.id, fixture.company.id, {
          winners: [
            { submissionId: fixture.submissionA.id, rank: 1 },
            { submissionId: fixture.submissionB.id, rank: 1 },
          ],
        }),
      ).rejects.toThrow("Duplicate rank in winners payload");

      await cleanupContestFixture(fixture);
    });

    it("should reject rejected submissions in multi-winner payload", async () => {
      const fixture = await createContestFixture();
      await prisma.taskSubmission.update({
        where: { id: fixture.submissionB.id },
        data: { status: SubmissionStatus.rejected },
      });

      await expect(
        taskService.selectMultipleWinners(fixture.task.id, fixture.company.id, {
          winners: [
            { submissionId: fixture.submissionA.id, rank: 1 },
            { submissionId: fixture.submissionB.id, rank: 2 },
          ],
        }),
      ).rejects.toThrow(`Submission ${fixture.submissionB.id} is rejected`);

      await cleanupContestFixture(fixture);
    });
  });
});
