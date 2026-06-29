import { Queue } from "bullmq";
import { redisConnection } from "./redisClient";

// Initialize Outreach Queue with Redis connection
export const outreachQueue = new Queue("outreach-queue", {
  connection: redisConnection as any,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: true,
  },
});

// local in-memory scheduling cache fallback for development without active Redis
export const memoryJobQueue: any[] = [];

/**
 * Add a lead outreach sequence step job to the queue.
 * Handles delay offsets (in days) using BullMQ delay configuration.
 */
export async function scheduleLeadSequenceStep(
  enrollmentId: string,
  leadId: string,
  sequenceId: string,
  stepIndex: number,
  delayDays: number = 0
): Promise<void> {
  const delayMs = delayDays * 24 * 60 * 60 * 1000; // Convert days to milliseconds
  const jobId = `${enrollmentId}_step_${stepIndex}`;

  const jobData = {
    enrollmentId,
    leadId,
    sequenceId,
    stepIndex,
  };

  try {
    // If Redis is connected, add to BullMQ
    if (redisConnection.status === "ready") {
      await outreachQueue.add(`outreach_step`, jobData, {
        jobId,
        delay: delayMs,
      });
      console.log(`📡 Queued sequence step job '${jobId}' with delay of ${delayDays} days.`);
      return;
    }
  } catch (error: any) {
    console.warn("⚠️ Failed to add job to Redis queue:", error.message);
  }

  // Fallback: Schedule in-memory execution for testing/dev environments
  console.log(`📁 Scheduling sequence step '${jobId}' in-memory to execute after ${delayDays} days.`);
  const scheduledTime = Date.now() + delayMs;
  memoryJobQueue.push({
    jobId,
    scheduledTime,
    data: jobData,
    processed: false,
  });

  // Start in-memory listener if not already running
  startMemoryQueueWorker();
}

let memoryWorkerActive = false;
function startMemoryQueueWorker() {
  if (memoryWorkerActive) return;
  memoryWorkerActive = true;

  // Poll memory queue every 3 seconds
  setInterval(async () => {
    const now = Date.now();
    const readyJobs = memoryJobQueue.filter(j => !j.processed && now >= j.scheduledTime);

    for (const job of readyJobs) {
      job.processed = true;
      console.log(`⚙️ In-Memory Queue processing job: ${job.jobId}`);
      try {
        const { processSequenceJob } = require("./outreachWorker");
        await processSequenceJob(job.data);
      } catch (err: any) {
        console.error(`❌ In-Memory Queue process failed for job ${job.jobId}:`, err.message);
      }
    }
  }, 3000);
}
