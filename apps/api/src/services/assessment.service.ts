import { getPrismaClient } from "../config/database";
import { getRedisClient } from "../config/redis";
import { v4 as uuidv4 } from "uuid";
import { AssessmentGeneratorService } from "./assessment-generator.service";
import { CodeEvaluatorService } from "./code-evaluator.service";
import { ReportGeneratorService } from "./report-generator.service";
import { NeuronScoreService } from "./neuron-score.service";
import { Queue } from "bullmq";
import { getBullMQConnection } from "../config/bullmq";

export class AssessmentService {
  private prisma = getPrismaClient();
  private redis = getRedisClient();
  private generator = new AssessmentGeneratorService();
  private evaluator = new CodeEvaluatorService();
  private reportGenerator = new ReportGeneratorService();
  private neuronScoreService = new NeuronScoreService();
  private assessmentQueue: Queue | null;

  constructor() {
    const connection = getBullMQConnection();
    this.assessmentQueue = connection
      ? new Queue("assessment-processing", { connection })
      : null;
  }

  /**
   * Generate new assessment
   */
  async generateAssessment(
    engineerProfileId: string,
    userId: string,
  ): Promise<any> {
    const profile = await this.prisma.engineerProfile.findUnique({
      where: { id: engineerProfileId },
      include: { skills: true },
    });

    if (!profile) {
      throw new Error("Engineer profile not found");
    }

    // Check completeness (must be >= 70%)
    if (profile.completenessScore < 70) {
      throw new Error(
        "Profile must be at least 70% complete to take assessment",
      );
    }

    // Determine experience level
    const experienceLevel = this.determineExperienceLevel(
      profile.yearsOfExperience || 0,
    );

    // Get skills
    const skills = profile.skills.map((s) => s.skillName);

    // Generate assessment content
    const { questions, codingTasks, caseScenario } =
      await this.generator.generateAssessment(skills, experienceLevel);

    // Create session token
    const sessionToken = uuidv4();

    // Create assessment record
    const assessment = await this.prisma.assessment.create({
      data: {
        id: uuidv4(),
        engineerProfileId,
        userId,
        sessionId: uuidv4(), // required unique field
        sessionToken,
        skillsAssessed: skills,
        experienceLevel,
        mcqQuestions: JSON.stringify(questions),
        codingTasks: JSON.stringify(codingTasks),
        caseScenario: JSON.stringify(caseScenario),
        status: "pending",
        proctoringEvents: JSON.stringify([]),
        tabSwitches: 0,
        focusLosses: 0,
        pasteAttempts: 0,
      },
    });

    // Store session in Redis (2.5 hours TTL)
    await this.redis.setex(
      `assessment:${sessionToken}`,
      9000,
      JSON.stringify({
        assessmentId: assessment.id,
        engineerProfileId,
        userId,
        startedAt: null,
      }),
    );

    return {
      assessmentId: assessment.id,
      sessionToken,
      questions,
      codingTasks,
      caseScenario,
    };
  }

  /**
   * Start assessment session
   */
  async startAssessment(
    sessionToken: string,
    ipAddress: string,
    deviceFingerprint: string,
  ): Promise<void> {
    const assessment = await this.prisma.assessment.findUnique({
      where: { sessionToken },
    });

    if (!assessment) {
      throw new Error("Assessment not found");
    }

    if (assessment.status !== "pending") {
      throw new Error("Assessment already started");
    }

    await this.prisma.assessment.update({
      where: { id: assessment.id },
      data: {
        status: "in_progress",
        startedAt: new Date(),
        ipAddress,
        deviceFingerprint,
      },
    });
  }

  /**
   * Submit assessment
   */
  async submitAssessment(
    assessmentId: string,
    responses: {
      mcqResponses: any;
      codingSubmissions: any;
      caseResponse: string;
    },
  ): Promise<void> {
    const assessment = await this.prisma.assessment.findUnique({
      where: { id: assessmentId },
    });

    if (!assessment) {
      throw new Error("Assessment not found");
    }

    if (assessment.status !== "in_progress" && assessment.status !== "paused") {
      throw new Error("Assessment cannot be submitted in current state");
    }

    // Update assessment with responses
    await this.prisma.assessment.update({
      where: { id: assessmentId },
      data: {
        status: "submitted",
        submittedAt: new Date(),
        mcqResponses: JSON.stringify(responses.mcqResponses),
        codingSubmissions: JSON.stringify(responses.codingSubmissions),
        caseResponse: responses.caseResponse,
      },
    });

    // Queue for async evaluation (or run inline when BullMQ disabled)
    if (this.assessmentQueue) {
      await this.assessmentQueue.add("evaluate-assessment", {
        assessmentId,
      });
    } else {
      await this.evaluateAssessment(assessmentId);
    }
  }

  /**
   * Evaluate assessment (called by BullMQ worker)
   */
  async evaluateAssessment(assessmentId: string): Promise<void> {
    const assessment = await this.prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: {
        engineerProfile: {
          include: { skills: true, projects: true },
        },
      },
    });

    if (!assessment) {
      throw new Error("Assessment not found");
    }

    // Parse data
    const questions = JSON.parse(assessment.mcqQuestions as string);
    const mcqResponses = JSON.parse(assessment.mcqResponses as string);
    const codingTasks = JSON.parse(assessment.codingTasks as string);
    const codingSubmissions = JSON.parse(
      assessment.codingSubmissions as string,
    );

    // Evaluate MCQ
    const mcqScore = this.evaluateMCQ(questions, mcqResponses);

    // Evaluate coding tasks
    const codingResults = await this.evaluateCoding(
      codingTasks,
      codingSubmissions,
    );
    const codingScore = codingResults.averageScore;

    // Evaluate case study (simplified - in production, use Claude API)
    const caseScore = 75; // Placeholder

    // Calculate total score
    const totalScore = Math.round(
      mcqScore * 0.4 + // 40%
        codingScore * 0.4 + // 40%
        caseScore * 0.2, // 20%
    );

    // Calculate dimension scores
    const dimensionScores = this.calculateDimensionScores(
      mcqScore,
      codingScore,
      caseScore,
      questions,
      codingResults,
    );

    // Determine tier
    const tier = this.determineTierFromScore(totalScore);

    // Check plagiarism
    const plagiarismDetected = codingResults.plagiarismDetected;

    // Update assessment
    await this.prisma.assessment.update({
      where: { id: assessmentId },
      data: {
        status: "evaluated",
        evaluatedAt: new Date(),
        mcqScore,
        codingScore,
        caseScore,
        overallScore: totalScore,
        ...dimensionScores,
        tier,
        plagiarismFlagged: plagiarismDetected,
      },
    });

    // Generate report
    await this.generateReport(assessmentId);

    // Initialize NeuronScore if first assessment
    if (assessment.engineerProfile.neuronScore === 0) {
      // const initialScore = this.neuronScoreService.getInitialScoreFromTier(tier);
      await this.neuronScoreService.recalculateScore(
        assessment.engineerProfileId,
        `Initial assessment completed: ${tier} tier`,
        "assessment",
        "system",
      );
    }
  }

  /**
   * Generate report (called by BullMQ worker)
   */
  private async generateReport(assessmentId: string): Promise<void> {
    const assessment = await this.prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: {
        engineerProfile: {
          include: { skills: true },
        },
      },
    });

    if (!assessment) return;

    // Generate report using Claude API
    const report = await this.reportGenerator.generateReport(
      assessment,
      assessment.engineerProfile,
    );

    // Generate PDF
    const reportUrl = await this.reportGenerator.generatePDFReport(
      report,
      assessment.engineerProfile,
    );

    // Update assessment
    await this.prisma.assessment.update({
      where: { id: assessmentId },
      data: {
        reportUrl,
        reportGenerated: true,
        skillGapAnalysis: JSON.stringify(report.skillGapAnalysis),
        improvementRoadmap: JSON.stringify(report.improvementRoadmap),
      },
    });
  }

  /**
   * Evaluate MCQ responses
   */
  private evaluateMCQ(questions: any[], responses: any[]): number {
    let correct = 0;

    questions.forEach((question, index) => {
      if (responses[index] === question.correctAnswer) {
        correct++;
      }
    });

    return Math.round((correct / questions.length) * 100);
  }

  /**
   * Evaluate coding submissions
   */
  private async evaluateCoding(
    tasks: any[],
    submissions: any[],
  ): Promise<{
    averageScore: number;
    plagiarismDetected: boolean;
    results: any[];
  }> {
    const results = [];
    let totalScore = 0;
    let plagiarismDetected = false;

    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      const submission = submissions[i];

      if (!submission || !submission.code) {
        results.push({ score: 0, passed: false });
        continue;
      }

      // Evaluate code
      const evaluation = await this.evaluator.evaluateCode(
        submission.code,
        task.testCases,
      );

      // Check plagiarism
      const plagiarismCheck = await this.evaluator.checkPlagiarism(
        submission.code,
        [], // TODO: Load known solutions from database
      );

      if (plagiarismCheck.isPlagiarized) {
        plagiarismDetected = true;
      }

      const score = (evaluation.correctness + evaluation.efficiency) / 2;
      totalScore += score;

      results.push({
        score,
        passed: evaluation.passed,
        correctness: evaluation.correctness,
        efficiency: evaluation.efficiency,
        plagiarism: plagiarismCheck.isPlagiarized,
      });
    }

    return {
      averageScore: Math.round(totalScore / tasks.length),
      plagiarismDetected,
      results,
    };
  }

  /**
   * Calculate dimension scores
   */
  private calculateDimensionScores(
    mcqScore: number,
    codingScore: number,
    caseScore: number,
    questions: any[],
    codingResults: any,
  ): any {
    // Simplified dimension calculation
    // In production, analyze question categories and coding patterns

    return {
      modelKnowledge: Math.round(mcqScore * 0.7 + codingScore * 0.3),
      engineeringDepth: Math.round(codingScore * 0.6 + mcqScore * 0.4),
      systemDesign: Math.round(caseScore * 0.7 + mcqScore * 0.3),
      codingQuality: Math.round(codingResults.averageScore),
      practicalApp: Math.round(caseScore * 0.6 + codingScore * 0.4),
      communication: Math.round(caseScore * 0.8 + mcqScore * 0.2),
    };
  }

  /**
   * Determine tier from total score
   */
  private determineTierFromScore(score: number): string {
    if (score >= 85) return "elite";
    if (score >= 70) return "professional";
    if (score >= 60) return "verified";
    if (score >= 40) return "conditional";
    return "rejected";
  }

  /**
   * Determine experience level from years
   */
  private determineExperienceLevel(years: number): "junior" | "mid" | "senior" {
    if (years < 2) return "junior";
    if (years < 5) return "mid";
    return "senior";
  }

  /**
   * Get assessment by ID
   */
  async getAssessment(assessmentId: string): Promise<any> {
    return await this.prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: {
        engineerProfile: {
          select: {
            fullName: true,
            skills: true,
          },
        },
      },
    });
  }

  /**
   * Get assessment by session token
   */
  async getAssessmentByToken(sessionToken: string): Promise<any> {
    return await this.prisma.assessment.findUnique({
      where: { sessionToken },
    });
  }
}
