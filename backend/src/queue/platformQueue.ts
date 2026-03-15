import { env } from '../config/env';

export type PlatformJob = { name: string; payload: any; queuedAt: number; attempts: number };
const jobs: PlatformJob[] = [];

export const enqueuePlatformJob = async (name: string, payload: unknown) => {
  jobs.push({ name, payload, queuedAt: Date.now(), attempts: env.QUEUE_RETRY_ATTEMPTS });
};

export const drainInMemoryJobs = () => {
  const pending = [...jobs];
  jobs.length = 0;
  return pending;
};
