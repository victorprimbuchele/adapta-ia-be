import { Queue } from "bullmq";

import { getRedisConnectionOptions } from "../../../../shared/infra/redis.js";
import type {
  AdaptationQueue,
  HomeworkAdaptationJob,
} from "../../ports/adaptation-queue.js";
import { HOMEWORK_ADAPTATION_QUEUE } from "../../ports/adaptation-queue.js";

/** Opções padrão de job: retries com backoff (ADR 006) e retenção limitada. */
const DEFAULT_JOB_OPTIONS = {
  attempts: 3,
  backoff: {
    type: "exponential" as const,
    delay: 2_000,
  },
  removeOnComplete: 100,
  removeOnFail: 100,
};

/**
 * Adapter BullMQ de `AdaptationQueue` (Épico 5, BE-E5.2 / ADR 006).
 * Só adiciona jobs à fila — a resposta HTTP não espera o worker/LLM.
 */
export class BullMqAdaptationQueue implements AdaptationQueue {
  private readonly queue = new Queue<HomeworkAdaptationJob>(
    HOMEWORK_ADAPTATION_QUEUE,
    {
      connection: getRedisConnectionOptions(),
      defaultJobOptions: DEFAULT_JOB_OPTIONS,
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
        ...DEFAULT_JOB_OPTIONS,
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
