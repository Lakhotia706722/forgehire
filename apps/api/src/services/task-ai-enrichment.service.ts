import Anthropic from "@anthropic-ai/sdk";
import { getEnv } from "../config/env";
import { Queue } from "bullmq";
import { getBullMQConnection } from "../config/bullmq";

export interface TaskEnrichmentResult {
  estimatedTimeline: number; // days
  suggestedReward: {
    min: number;
    max: number;
    currency: string;
  };
  vagueDeliverables: string[];
  recommendedType: "bounty" | "direct" | "contest";
  autoTaggedSkills: string[];
  postingQuality: number; // 1-10
  suggestions: string[];
}

export class TaskAIEnrichmentService {
  private anthropic: Anthropic;
  private enrichmentQueue: Queue | null;

  constructor() {
    const env = getEnv();
    this.anthropic = new Anthropic({
      apiKey: env.ANTHROPIC_API_KEY,
    });

    const connection = getBullMQConnection();
    this.enrichmentQueue = connection
      ? new Queue("task-enrichment", { connection })
      : null;
  }

  /**
   * Queue task for AI enrichment (async via BullMQ)
   */
  async queueEnrichment(taskId: string, taskData: any): Promise<void> {
    if (!this.enrichmentQueue) {
      await this.enrichTaskInline(taskId, taskData);
      return;
    }
    await this.enrichmentQueue.add("enrich-task", {
      taskId,
      taskData,
    });
  }

  /** Run enrichment synchronously when BullMQ is disabled (memory Redis / local dev) */
  private async enrichTaskInline(taskId: string, _taskData: any): Promise<void> {
    const { TaskService } = await import("./task.service");
    const taskService = new TaskService();
    await taskService.enrichTask(taskId);
  }

  /**
   * Enrich task with AI intelligence
   */
  async enrichTask(taskData: any): Promise<TaskEnrichmentResult> {
    const prompt = `You are an AI task analysis expert. Analyze this task posting and provide insights.

Task Details:
- Title: ${taskData.title}
- Type: ${taskData.type}
- Problem Statement: ${taskData.problemStatement}
- Expected Outcome: ${taskData.expectedOutcome}
- Deliverables: ${JSON.stringify(taskData.deliverables)}
- Tech Requirements: ${taskData.techRequirements.join(", ")}
- Timeline: ${taskData.timeline} days
- Reward: ₹${taskData.rewardAmount}
- Difficulty: ${taskData.difficulty}

Provide:
1. Estimated realistic timeline (in days)
2. Fair reward range (min and max in INR)
3. List any vague or unclear deliverables
4. Recommend best task type (bounty/direct/contest)
5. Auto-tag required skills (extract from description)
6. Rate posting quality (1-10, where 10 is excellent)
7. Suggestions for improvement

Return as JSON:
{
  "estimatedTimeline": 14,
  "suggestedReward": {"min": 15000, "max": 25000, "currency": "INR"},
  "vagueDeliverables": ["deliverable that needs clarification"],
  "recommendedType": "bounty",
  "autoTaggedSkills": ["Python", "TensorFlow", "FastAPI"],
  "postingQuality": 8,
  "suggestions": ["suggestion1", "suggestion2"]
}`;

    try {
      const message = await this.anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 2048,
        messages: [{ role: "user", content: prompt }],
      });

      const content = message.content[0];
      if (content.type === "text") {
        const jsonMatch = content.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }

      return this.getFallbackEnrichment(taskData);
    } catch (error) {
      console.error("Task enrichment error:", error);
      return this.getFallbackEnrichment(taskData);
    }
  }

  /**
   * Fallback enrichment if AI fails
   */
  private getFallbackEnrichment(taskData: any): TaskEnrichmentResult {
    // Simple heuristics
    const baseReward = parseFloat(taskData.rewardAmount.toString());

    return {
      estimatedTimeline: taskData.timeline,
      suggestedReward: {
        min: Math.round(baseReward * 0.8),
        max: Math.round(baseReward * 1.2),
        currency: "INR",
      },
      vagueDeliverables: [],
      recommendedType: taskData.type,
      autoTaggedSkills: taskData.techRequirements,
      postingQuality: 7,
      suggestions: [
        "Consider adding more specific deliverables",
        "Include acceptance criteria for each deliverable",
      ],
    };
  }

  /**
   * Validate task posting quality
   */
  validateTaskPosting(taskData: any): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!taskData.title || taskData.title.length < 10) {
      errors.push("Title must be at least 10 characters");
    }

    if (!taskData.problemStatement || taskData.problemStatement.length < 50) {
      errors.push("Problem statement must be at least 50 characters");
    }

    if (!taskData.expectedOutcome || taskData.expectedOutcome.length < 30) {
      errors.push("Expected outcome must be at least 30 characters");
    }

    if (!taskData.deliverables || taskData.deliverables.length === 0) {
      errors.push("At least one deliverable is required");
    }

    if (!taskData.techRequirements || taskData.techRequirements.length === 0) {
      errors.push("At least one tech requirement is required");
    }

    if (taskData.timeline < 1) {
      errors.push("Timeline must be at least 1 day");
    }

    if (taskData.rewardAmount < 1000) {
      errors.push("Reward amount must be at least ₹1,000");
    }

    // Warnings
    if (taskData.timeline > 90) {
      warnings.push(
        "Timeline exceeds 90 days - consider breaking into smaller tasks",
      );
    }

    if (taskData.rewardAmount > 500000) {
      warnings.push("High reward amount - ensure escrow can be funded");
    }

    if (taskData.deliverables.length > 10) {
      warnings.push(
        "Many deliverables - consider simplifying or splitting task",
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
