import { Queue } from "bullmq";

import { getRedisConnectionOptions } from "../../../../shared/infra/redis.js";
import type { AdaptationQueueJobState } from "../../domain/adaptation-status.js";
import type { HomeworkAdaptationJob } from "../../ports/adaptation-queue.js";
import { HOMEWORK_ADAPTATION_QUEUE } from "../../ports/adaptation-queue.js";
import type {
  AdaptationJobSnapshot,
  AdaptationJobStatusPort,
} from "../../ports/adaptation-job-status.js";

const JOB_STATES = [
  "waiting",
  "delayed",
  "prioritized",
  "active",
  "completed",
  "failed",
] as const;

/**
 * Consulta o estado dos jobs BullMQ de adaptação (Épico 5, BE-E5.9 / BE-E5.10).
 */
export class BullMqAdaptationJobStatus implements AdaptationJobStatusPort {
  private readonly queue = new Queue<HomeworkAdaptationJob>(
    HOMEWORK_ADAPTATION_QUEUE,
    {
      connection: getRedisConnectionOptions(),
    },
  );

  async listByHomeworkId(homeworkId: string): Promise<AdaptationJobSnapshot[]> {
    const jobs = await this.queue.getJobs([...JOB_STATES]);
    const snapshots: AdaptationJobSnapshot[] = [];

    for (const job of jobs) {
      if (job.data.homeworkId !== homeworkId) {
        continue;
      }

      const rawState = await job.getState();
      const snapshot: AdaptationJobSnapshot = {
        learningProfileId: job.data.learningProfileId,
        state: mapQueueState(rawState),
        attemptsMade: job.attemptsMade,
      };

      if (job.failedReason) {
        snapshot.failedReason = job.failedReason;
      }

      snapshots.push(snapshot);
    }

    return snapshots;
  }
}

export function mapQueueState(state: string): AdaptationQueueJobState {
  if (state === "active") {
    return "active";
  }

  if (state === "completed") {
    return "completed";
  }

  if (state === "failed") {
    return "failed";
  }

  if (
    state === "waiting" ||
    state === "delayed" ||
    state === "prioritized" ||
    state === "waiting-children"
  ) {
    return "waiting";
  }

  return "unknown";
}
