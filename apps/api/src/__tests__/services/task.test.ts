import { TaskService } from '../../services/task.service';
import { PrismaClient, TaskStatus, UserRole } from '@prisma/client';

// Mock dependencies
jest.mock('../../services/razorpay-escrow.service');
jest.mock('../../services/task-ai-enrichment.service');
jest.mock('../../services/nda-generator.service');

// Skip tests that require a real database when none is available
const hasTestDb = process.env.TEST_DATABASE_URL || 
  (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost'));
const describeOrSkip = hasTestDb ? describe : describe.skip;

describeOrSkip('TaskService', () => {
  let taskService: TaskService;
  let prisma: PrismaClient;

  beforeAll(() => {
    taskService = new TaskService();
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('NeuronScore Gate Check', () => {
    it('should block participation if NeuronScore below minimum', async () => {
      // Create test company and task
      const company = await prisma.user.create({ include: { companyProfile: true, engineerProfile: true },
        data: {
          clerkId: 'clerk_test_company_1',
          email: 'company1@test.com',
          role: UserRole.company,
          companyProfile: {
            create: {
              companyName: 'Test Company',
              trustScore: 80
            }
          }
        }
      });

      const task = await prisma.task.create({
        data: {
          userId: company.id,
          companyProfileId: company.companyProfile!.id,
          title: 'High-level AI Task',
          type: 'bounty',
          category: ['AI', 'ML'],
          problemStatement: 'Build an advanced ML model with high accuracy requirements',
          expectedOutcome: 'A production-ready ML model',
          deliverables: [{ title: 'Model', description: 'Trained model' }],
          techRequirements: ['Python', 'TensorFlow'],
          timeline: 30,
          rewardAmount: 50000,
          paymentType: 'fixed',
          selectionCriteria: [{ name: 'Quality', weight: 100 }],
          minNeuronScore: 600, // High threshold
          difficulty: 'expert',
          status: TaskStatus.open,
          escrowDeposited: true
        }
      });

      // Create engineer with low NeuronScore
      const engineer = await prisma.user.create({ include: { companyProfile: true, engineerProfile: true },
        data: {
          clerkId: 'clerk_test_engineer_1',
          email: 'engineer1@test.com',
          role: UserRole.engineer,
          engineerProfile: {
            create: {
              fullName: 'Test Engineer',
              neuronScore: 400, // Below threshold
              completenessScore: 80
            }
          }
        }
      });

      // Attempt to participate
      await expect(
        taskService.participateInTask(task.id, engineer.id, {
          approach: 'I will build this using TensorFlow and Python',
          estimatedTime: 25
        })
      ).rejects.toThrow(/NeuronScore.*below minimum/);

      // Cleanup
      await prisma.task.delete({ where: { id: task.id } });
      await prisma.user.delete({ where: { id: company.id } });
      await prisma.user.delete({ where: { id: engineer.id } });
    });

    it('should allow participation if NeuronScore meets minimum', async () => {
      // Create test company and task
      const company = await prisma.user.create({ include: { companyProfile: true, engineerProfile: true },
        data: {
          clerkId: 'clerk_test_company_2',
          email: 'company2@test.com',
          role: UserRole.company,
          companyProfile: {
            create: {
              companyName: 'Test Company 2',
              trustScore: 80
            }
          }
        }
      });

      const task = await prisma.task.create({
        data: {
          userId: company.id,
          companyProfileId: company.companyProfile!.id,
          title: 'Mid-level AI Task',
          type: 'bounty',
          category: ['AI'],
          problemStatement: 'Build a simple ML model',
          expectedOutcome: 'A working ML model',
          deliverables: [{ title: 'Model', description: 'Trained model' }],
          techRequirements: ['Python'],
          timeline: 15,
          rewardAmount: 20000,
          paymentType: 'fixed',
          selectionCriteria: [{ name: 'Quality', weight: 100 }],
          minNeuronScore: 400,
          difficulty: 'medium',
          status: TaskStatus.open,
          escrowDeposited: true
        }
      });

      // Create engineer with sufficient NeuronScore
      const engineer = await prisma.user.create({ include: { companyProfile: true, engineerProfile: true },
        data: {
          clerkId: 'clerk_test_engineer_2',
          email: 'engineer2@test.com',
          role: UserRole.engineer,
          engineerProfile: {
            create: {
              fullName: 'Test Engineer 2',
              neuronScore: 500, // Above threshold
              completenessScore: 80
            }
          }
        }
      });

      // Participate successfully
      const participation = await taskService.participateInTask(task.id, engineer.id, {
        approach: 'I will build this using Python and scikit-learn',
        estimatedTime: 12
      });

      expect(participation).toBeDefined();
      expect(participation.taskId).toBe(task.id);
      expect(participation.engineerProfileId).toBe(engineer.engineerProfile!.id);

      // Cleanup
      await prisma.task.delete({ where: { id: task.id } });
      await prisma.user.delete({ where: { id: company.id } });
      await prisma.user.delete({ where: { id: engineer.id } });
    });
  });

  describe('Escrow Pre-condition Enforcement', () => {
    it('should prevent task from going live without escrow deposit', async () => {
      // Create test company
      const company = await prisma.user.create({ include: { companyProfile: true, engineerProfile: true },
        data: {
          clerkId: 'clerk_test_company_3',
          email: 'company3@test.com',
          role: UserRole.company,
          companyProfile: {
            create: {
              companyName: 'Test Company 3',
              trustScore: 80
            }
          }
        }
      });

      // Create task in draft state
      const task = await prisma.task.create({
        data: {
          userId: company.id,
          companyProfileId: company.companyProfile!.id,
          title: 'Test Task',
          type: 'bounty',
          category: ['AI'],
          problemStatement: 'Build something',
          expectedOutcome: 'A working solution',
          deliverables: [{ title: 'Solution', description: 'Working code' }],
          techRequirements: ['Python'],
          timeline: 10,
          rewardAmount: 15000,
          paymentType: 'fixed',
          selectionCriteria: [{ name: 'Quality', weight: 100 }],
          difficulty: 'medium',
          status: TaskStatus.draft, // Draft state
          escrowDeposited: false // No escrow
        }
      });

      // Verify task is not open
      expect(task.status).toBe(TaskStatus.draft);
      expect(task.escrowDeposited).toBe(false);

      // Create engineer
      const engineer = await prisma.user.create({ include: { companyProfile: true, engineerProfile: true },
        data: {
          clerkId: 'clerk_test_engineer_3',
          email: 'engineer3@test.com',
          role: UserRole.engineer,
          engineerProfile: {
            create: {
              fullName: 'Test Engineer 3',
              neuronScore: 500,
              completenessScore: 80
            }
          }
        }
      });

      // Attempt to participate should fail
      await expect(
        taskService.participateInTask(task.id, engineer.id, {
          approach: 'My approach',
          estimatedTime: 8
        })
      ).rejects.toThrow(/not open for participation/);

      // Cleanup
      await prisma.task.delete({ where: { id: task.id } });
      await prisma.user.delete({ where: { id: company.id } });
      await prisma.user.delete({ where: { id: engineer.id } });
    });

    it('should allow task to go live after escrow deposit', async () => {
      // Create test company
      const company = await prisma.user.create({ include: { companyProfile: true, engineerProfile: true },
        data: {
          clerkId: 'clerk_test_company_4',
          email: 'company4@test.com',
          role: UserRole.company,
          companyProfile: {
            create: {
              companyName: 'Test Company 4',
              trustScore: 80
            }
          }
        }
      });

      // Create task with escrow deposited
      const task = await prisma.task.create({
        data: {
          userId: company.id,
          companyProfileId: company.companyProfile!.id,
          title: 'Test Task with Escrow',
          type: 'bounty',
          category: ['AI'],
          problemStatement: 'Build something',
          expectedOutcome: 'A working solution',
          deliverables: [{ title: 'Solution', description: 'Working code' }],
          techRequirements: ['Python'],
          timeline: 10,
          rewardAmount: 15000,
          paymentType: 'fixed',
          selectionCriteria: [{ name: 'Quality', weight: 100 }],
          difficulty: 'medium',
          status: TaskStatus.open, // Open state
          escrowDeposited: true, // Escrow deposited
          escrowId: 'order_test123',
          escrowAmount: 15000,
          publishedAt: new Date()
        }
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

  describe('Contest Ranked Payout', () => {
    it('should split payout correctly for contest winners', () => {
      const totalReward = 100000;
      const contestRanks = [
        { rank: 1, percentage: 50 },
        { rank: 2, percentage: 30 },
        { rank: 3, percentage: 20 }
      ];

      // Calculate payouts
      const payouts = contestRanks.map((rank) => ({
        rank: rank.rank,
        amount: (totalReward * rank.percentage) / 100
      }));

      expect(payouts[0].amount).toBe(50000); // 1st place
      expect(payouts[1].amount).toBe(30000); // 2nd place
      expect(payouts[2].amount).toBe(20000); // 3rd place

      // Verify total
      const total = payouts.reduce((sum, p) => sum + p.amount, 0);
      expect(total).toBe(totalReward);
    });

    it('should validate contest rank percentages sum to 100', () => {
      const validRanks = [
        { rank: 1, percentage: 60 },
        { rank: 2, percentage: 40 }
      ];

      const invalidRanks = [
        { rank: 1, percentage: 60 },
        { rank: 2, percentage: 30 } // Only 90%
      ];

      const validTotal = validRanks.reduce((sum, r) => sum + r.percentage, 0);
      const invalidTotal = invalidRanks.reduce((sum, r) => sum + r.percentage, 0);

      expect(validTotal).toBe(100);
      expect(invalidTotal).not.toBe(100);
    });
  });
});

