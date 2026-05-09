import { TaskService } from '../../services/task.service';
import { PrismaClient, UserRole, TaskStatus, SubmissionStatus } from '@prisma/client';

// Skip integration tests when no test database is available
const hasTestDb = process.env.TEST_DATABASE_URL || 
  (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost'));
const describeOrSkip = hasTestDb ? describe : describe.skip;

// Mock external services
jest.mock('../../services/razorpay-escrow.service', () => ({
  RazorpayEscrowService: jest.fn().mockImplementation(() => ({
    createEscrowOrder: jest.fn().mockResolvedValue({
      orderId: 'order_mock123',
      amount: 50000
    }),
    verifyEscrowPayment: jest.fn().mockResolvedValue(true),
    releaseEscrow: jest.fn().mockResolvedValue({
      payoutId: 'payout_mock123',
      status: 'processing'
    })
  }))
}));

jest.mock('../../services/task-ai-enrichment.service', () => ({
  TaskAIEnrichmentService: jest.fn().mockImplementation(() => ({
    queueEnrichment: jest.fn().mockResolvedValue(undefined),
    enrichTask: jest.fn().mockResolvedValue({
      estimatedTimeline: 25,
      suggestedReward: { min: 40000, max: 60000, currency: 'INR' },
      vagueDeliverables: [],
      recommendedType: 'bounty',
      autoTaggedSkills: ['Python', 'TensorFlow', 'FastAPI'],
      postingQuality: 9,
      suggestions: ['Great task description']
    }),
    validateTaskPosting: jest.fn().mockReturnValue({
      isValid: true,
      errors: [],
      warnings: []
    })
  }))
}));

jest.mock('../../services/nda-generator.service');

describeOrSkip('Task Flow Integration Test', () => {
  let taskService: TaskService;
  let prisma: PrismaClient;
  let companyUser: any;
  let engineerUser: any;
  let task: any;

  beforeAll(async () => {
    taskService = new TaskService();
    prisma = new PrismaClient();

    // Create company user
    companyUser = await prisma.user.create({
      data: {
        clerkId: 'clerk_integration_company',
        email: 'company@integration.test',
        role: UserRole.company,
        companyProfile: {
          create: {
            companyName: 'Integration Test Company',
            trustScore: 85,
            websiteVerified: true
          }
        }
      },
      include: { companyProfile: true }
    });

    // Create engineer user
    engineerUser = await prisma.user.create({
      data: {
        clerkId: 'clerk_integration_engineer',
        email: 'engineer@integration.test',
        role: UserRole.engineer,
        engineerProfile: {
          create: {
            fullName: 'Integration Test Engineer',
            neuronScore: 650,
            neuronTier: 'professional',
            completenessScore: 85,
            upiId: 'engineer@upi'
          }
        }
      },
      include: { engineerProfile: true }
    });
  });

  afterAll(async () => {
    // Cleanup
    if (task) {
      await prisma.task.delete({ where: { id: task.id } }).catch(() => {});
    }
    await prisma.user.delete({ where: { id: companyUser.id } }).catch(() => {});
    await prisma.user.delete({ where: { id: engineerUser.id } }).catch(() => {});
    await prisma.$disconnect();
  });

  it('should complete full task lifecycle: create → enrich → escrow → publish → participate → submit → select winner → payout', async () => {
    // Step 1: Create task (draft state)
    console.log('Step 1: Creating task...');
    task = await taskService.createTask(companyUser.id, {
      title: 'Build AI-Powered Chatbot for Customer Support',
      type: 'bounty',
      category: ['AI', 'NLP', 'Chatbot'],
      problemStatement: 'We need an AI chatbot that can handle customer support queries with high accuracy. The chatbot should understand context, handle multiple languages, and integrate with our existing CRM system.',
      currentState: 'Currently using manual support team, response time is 2-3 hours',
      expectedOutcome: 'A production-ready chatbot with 90%+ accuracy, <1s response time, and seamless CRM integration',
      deliverables: [
        {
          title: 'Trained AI Model',
          description: 'Fine-tuned language model for customer support',
          acceptanceCriteria: ['90%+ accuracy on test dataset', 'Handles 10+ intent categories']
        },
        {
          title: 'API Integration',
          description: 'RESTful API with FastAPI',
          acceptanceCriteria: ['<1s response time', 'Rate limiting', 'Authentication']
        },
        {
          title: 'Documentation',
          description: 'Complete API docs and deployment guide',
          acceptanceCriteria: ['API reference', 'Setup instructions', 'Example usage']
        }
      ],
      techRequirements: ['Python', 'TensorFlow', 'FastAPI', 'Docker'],
      timeline: 30,
      rewardAmount: 50000,
      paymentType: 'fixed',
      currency: 'INR',
      selectionCriteria: [
        { name: 'Model Accuracy', weight: 40, description: 'Accuracy on test dataset' },
        { name: 'Response Time', weight: 30, description: 'API response latency' },
        { name: 'Code Quality', weight: 20, description: 'Clean, maintainable code' },
        { name: 'Documentation', weight: 10, description: 'Complete documentation' }
      ],
      minNeuronScore: 500,
      ndaRequired: false,
      difficulty: 'hard',
      isContest: false
    });

    expect(task).toBeDefined();
    expect(task.status).toBe(TaskStatus.draft);
    expect(task.escrowDeposited).toBe(false);
    console.log('✅ Task created:', task.id);

    // Step 2: AI Enrichment
    console.log('Step 2: Enriching task with AI...');
    const enrichedTask = await taskService.enrichTask(task.id);
    
    expect(enrichedTask.aiEnriched).toBe(true);
    expect(enrichedTask.postingQuality).toBeGreaterThan(0);
    expect(enrichedTask.autoTaggedSkills).toContain('Python');
    console.log('✅ Task enriched. Quality:', enrichedTask.postingQuality);

    // Step 3: Create escrow order
    console.log('Step 3: Creating escrow order...');
    const escrowOrder = await taskService.createEscrowOrder(task.id, companyUser.id);
    
    expect(escrowOrder.orderId).toBeDefined();
    expect(escrowOrder.amount).toBe(50000);
    console.log('✅ Escrow order created:', escrowOrder.orderId);

    // Verify task status changed to pending_escrow
    const taskAfterEscrow = await prisma.task.findUnique({ where: { id: task.id } });
    expect(taskAfterEscrow?.status).toBe(TaskStatus.pending_escrow);

    // Step 4: Deposit escrow (verify payment and publish)
    console.log('Step 4: Depositing escrow...');
    const publishedTask = await taskService.depositEscrow(task.id, companyUser.id, {
      taskId: task.id,
      orderId: escrowOrder.orderId,
      paymentId: 'pay_mock123',
      signature: 'mock_signature'
    });

    expect(publishedTask.status).toBe(TaskStatus.open);
    expect(publishedTask.escrowDeposited).toBe(true);
    expect(publishedTask.publishedAt).toBeDefined();
    console.log('✅ Escrow deposited. Task is now live!');

    // Step 5: Engineer participates
    console.log('Step 5: Engineer participating...');
    const participation = await taskService.participateInTask(
      task.id,
      engineerUser.id,
      {
        approach: 'I will use GPT-based model fine-tuned on your support data. Architecture: FastAPI backend with Redis caching, Docker containerized deployment. I have 5+ years experience building production chatbots.',
        estimatedTime: 25,
        proposedRate: null
      }
    );

    expect(participation).toBeDefined();
    expect(participation.taskId).toBe(task.id);
    console.log('✅ Engineer participated');

    // Verify participant count increased
    const taskAfterParticipation = await prisma.task.findUnique({ where: { id: task.id } });
    expect(taskAfterParticipation?.participantCount).toBe(1);

    // Step 6: Engineer submits work
    console.log('Step 6: Engineer submitting work...');
    const submission = await taskService.submitTask(
      task.id,
      engineerUser.id,
      {
        description: 'Completed chatbot with 92% accuracy on test dataset. API response time averages 0.8s. Fully containerized with Docker. Includes comprehensive documentation and deployment scripts.',
        demoUrl: 'https://demo.chatbot.test',
        githubUrl: 'https://github.com/engineer/chatbot',
        codeUrl: 'https://github.com/engineer/chatbot/archive/main.zip',
        screenshots: [
          'https://s3.amazonaws.com/screenshots/chat1.png',
          'https://s3.amazonaws.com/screenshots/chat2.png'
        ],
        videoUrl: 'https://youtube.com/demo-video',
        performanceMetrics: {
          accuracy: 0.92,
          avgResponseTime: 0.8,
          testCases: 500,
          passRate: 0.96
        },
        architectureDiagram: 'https://s3.amazonaws.com/diagrams/architecture.png'
      }
    );

    expect(submission).toBeDefined();
    expect(submission.status).toBe(SubmissionStatus.pending);
    console.log('✅ Work submitted');

    // Verify task status changed to in_review
    const taskAfterSubmission = await prisma.task.findUnique({ where: { id: task.id } });
    expect(taskAfterSubmission?.status).toBe(TaskStatus.in_review);
    expect(taskAfterSubmission?.submissionCount).toBe(1);

    // Step 7: Company evaluates submission
    console.log('Step 7: Evaluating submission...');
    const evaluatedSubmission = await taskService.evaluateSubmission(
      submission.id,
      companyUser.id,
      {
        submissionId: submission.id,
        score: 92,
        feedback: 'Excellent work! Model accuracy exceeds requirements, API is fast and well-documented. Code quality is professional.',
        criteriaScores: {
          'Model Accuracy': 95,
          'Response Time': 90,
          'Code Quality': 90,
          'Documentation': 92
        }
      }
    );

    expect(evaluatedSubmission.score).toBe(92);
    expect(evaluatedSubmission.status).toBe(SubmissionStatus.under_review);
    console.log('✅ Submission evaluated. Score:', evaluatedSubmission.score);

    // Step 8: Company selects winner
    console.log('Step 8: Selecting winner...');
    const winnerResult = await taskService.selectWinner(
      task.id,
      companyUser.id,
      {
        submissionId: submission.id,
        rank: 1
      }
    );

    expect(winnerResult.success).toBe(true);
    expect(winnerResult.payoutId).toBeDefined();
    console.log('✅ Winner selected. Payout initiated:', winnerResult.payoutId);

    // Verify submission marked as winner
    const winnerSubmission = await prisma.taskSubmission.findUnique({
      where: { id: submission.id }
    });
    expect(winnerSubmission?.isWinner).toBe(true);
    expect(winnerSubmission?.status).toBe(SubmissionStatus.winner);
    expect(winnerSubmission?.payoutAmount).toBeDefined();
    expect(winnerSubmission?.payoutId).toBe(winnerResult.payoutId);

    // Verify task marked as completed
    const completedTask = await prisma.task.findUnique({ where: { id: task.id } });
    expect(completedTask?.status).toBe(TaskStatus.completed);
    expect(completedTask?.completedAt).toBeDefined();

    console.log('\n🎉 Full task lifecycle completed successfully!');
    console.log('Summary:');
    console.log('- Task created and enriched');
    console.log('- Escrow deposited: ₹50,000');
    console.log('- Engineer participated and submitted');
    console.log('- Submission evaluated: 92/100');
    console.log('- Winner selected, payout initiated');
    console.log('- Task completed');
  });
});
