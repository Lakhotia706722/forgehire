import { Worker, Job } from 'bullmq';
import { TaskService } from '../services/task.service';
import { getEnv } from '../config/env';

// Validate env at worker startup
getEnv();

const taskService = new TaskService();

// Create worker for task enrichment
const worker = new Worker(
  'task-enrichment',
  async (job: Job) => {
    console.log(`Processing task enrichment job ${job.id}`);
    
    try {
      const { taskId } = job.data;

      // Enrich task with AI
      const enrichedTask = await taskService.enrichTask(taskId);

      console.log(`Task ${taskId} enriched successfully`);
      console.log(`Posting quality: ${enrichedTask.postingQuality}/10`);
      console.log(`Suggested timeline: ${enrichedTask.estimatedTimeline} days`);
      console.log(`Auto-tagged skills: ${enrichedTask.autoTaggedSkills.join(', ')}`);

      return {
        success: true,
        taskId,
        enrichment: {
          postingQuality: enrichedTask.postingQuality,
          estimatedTimeline: enrichedTask.estimatedTimeline,
          suggestedReward: enrichedTask.suggestedReward,
          autoTaggedSkills: enrichedTask.autoTaggedSkills,
          vagueDeliverables: enrichedTask.vagueDeliverables
        }
      };
    } catch (error: any) {
      console.error(`Task enrichment failed for job ${job.id}:`, error);
      throw error;
    }
  },
  {
    connection: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379')
    },
    concurrency: 5, // Process 5 jobs concurrently
    limiter: {
      max: 10, // Max 10 jobs
      duration: 60000 // Per 60 seconds (rate limit for Claude API)
    }
  }
);

// Worker event handlers
worker.on('completed', (job) => {
  console.log(`✅ Task enrichment job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`❌ Task enrichment job ${job?.id} failed:`, err.message);
});

worker.on('error', (err) => {
  console.error('Worker error:', err);
});

console.log('🚀 Task enrichment worker started');

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing worker...');
  await worker.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing worker...');
  await worker.close();
  process.exit(0);
});
