import { Queue } from "bullmq";

import { getRedisConnectionOptions } from "../../../../shared/infra/redis.js";
import { ADAPTATION_JOB_OPTIONS } from "../../application/adaptation-job-options.js";
import type {
  AdaptationQueue,
  HomeworkAdaptationJob,
} from "../../ports/adaptation-queue.js";
import { HOMEWORK_ADAPTATION_QUEUE } from "../../ports/adaptation-queue.js";

/**
 * Adapter BullMQ de `AdaptationQueue` (Épico 5, BE-E5.2 / BE-E5.10 / ADR 006).
 * Retry com backoff exponencial (3 tentativas); a resposta HTTP não espera
 * o worker/LLM.
 */
export class BullMqAdaptationQueue implements AdaptationQueue {
  private readonly queue = new Queue<HomeworkAdaptationJob>(
    HOMEWORK_ADAPTATION_QUEUE,
    {
      connection: getRedisConnectionOptions(),
      defaultJobOptions: ADAPTATION_JOB_OPTIONS,
    },
  );

  async enqueue(jobs: HomeworkAdaptationJob[]): Promise<void> {
    if (jobs.length === 0) {
      return;
    }

    await Promise.all(jobs.map((data) => this.addIgnoringDuplicate(data)));
  }

  private async addIgnoringDuplicate(
    data: HomeworkAdaptationJob,
  ): Promise<void> {
    try {
      await this.queue.add("adapt", data, {
        jobId: adaptationJobId(data),
        ...ADAPTATION_JOB_OPTIONS,
      });
    } catch (error) {
      if (!isDuplicateJobError(error)) {
        throw error;
      }
    }
  }
}

export function adaptationJobId(job: HomeworkAdaptationJob): string {
  return `adapt:${job.homeworkId}:${job.learningProfileId}`;
}

function isDuplicateJobError(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.message.toLowerCase().includes("already exists")
  );
}
