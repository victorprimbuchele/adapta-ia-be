import { Queue } from "bullmq";

import { getRedisConnectionOptions } from "../../../../shared/infra/redis.js";
import type {
  AdaptationQueue,
  HomeworkAdaptationJob,
} from "../../ports/adaptation-queue.js";
import { HOMEWORK_ADAPTATION_QUEUE } from "../../ports/adaptation-queue.js";

/**
 * Adapter BullMQ de `AdaptationQueue` (ver Épico 5, BE-E5.1 / ADR 006).
 */
export class BullMqAdaptationQueue implements AdaptationQueue {
  private readonly queue = new Queue<HomeworkAdaptationJob>(
    HOMEWORK_ADAPTATION_QUEUE,
    { connection: getRedisConnectionOptions() },
  );

  async enqueue(jobs: HomeworkAdaptationJob[]): Promise<void> {
    if (jobs.length === 0) {
      return;
    }

    await this.queue.addBulk(
      jobs.map((data) => ({
        name: "adapt",
        data,
        opts: {
          removeOnComplete: 100,
          removeOnFail: 100,
        },
      })),
    );
  }
}
