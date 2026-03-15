import { env } from '../config/env';

export interface InboundMessageQueuePayload {
  mobile: string;
  message: string;
  messageId?: string;
}

interface QueuedJob {
  id: number;
  payload: InboundMessageQueuePayload;
  attemptsMade: number;
  createdAt: number;
}

interface FailedJob {
  id: number;
  payload: InboundMessageQueuePayload;
  attemptsMade: number;
  failedReason: string;
  failedAt: number;
}

let sequence = 0;
const waiting: QueuedJob[] = [];
const active = new Set<number>();
const failed: FailedJob[] = [];
let completedCount = 0;

export const queueConfig = {
  retryAttempts: env.QUEUE_RETRY_ATTEMPTS,
  retryDelayMs: 1000
};

export const messageQueue = {
  enqueue(payload: InboundMessageQueuePayload) {
    sequence += 1;
    const job: QueuedJob = {
      id: sequence,
      payload,
      attemptsMade: 0,
      createdAt: Date.now()
    };

    waiting.push(job);
    return job;
  },

  takeNextJob() {
    const job = waiting.shift();
    if (!job) return null;
    active.add(job.id);
    return job;
  },

  markCompleted(jobId: number) {
    active.delete(jobId);
    completedCount += 1;
  },

  markFailed(job: QueuedJob, error: unknown) {
    active.delete(job.id);
    job.attemptsMade += 1;

    if (job.attemptsMade < queueConfig.retryAttempts) {
      setTimeout(() => {
        waiting.push(job);
      }, queueConfig.retryDelayMs * job.attemptsMade);
      return;
    }

    failed.unshift({
      id: job.id,
      payload: job.payload,
      attemptsMade: job.attemptsMade,
      failedReason: error instanceof Error ? error.message : 'Unknown queue processing error',
      failedAt: Date.now()
    });

    if (failed.length > 200) {
      failed.length = 200;
    }
  },

  getStats() {
    return {
      waiting: waiting.length,
      active: active.size,
      completed: completedCount,
      failed: failed.length,
      delayed: 0,
      backlog: waiting.length + active.size
    };
  },

  getFailed(limit = 50) {
    return failed.slice(0, Math.max(1, limit));
  }
};
