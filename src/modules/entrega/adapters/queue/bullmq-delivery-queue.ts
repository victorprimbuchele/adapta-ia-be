import { Queue } from "bullmq";

import { getRedisConnectionOptions } from "../../../../shared/infra/redis.js";
import { DELIVERY_JOB_OPTIONS } from "../../application/delivery-job-options.js";
import type { DeliveryQueuePort, DeliveryRecipientJob } from "../../ports/delivery-queue.js";
import { HOMEWORK_DELIVERY_QUEUE } from "../../ports/delivery-queue.js";

/**
 * Adapter BullMQ de `DeliveryQueuePort` (Épico 6, BE-E6.2 — espelha
 * `BullMqAdaptationQueue`). Retry com backoff exponencial (3 tentativas);
 * a resposta HTTP não espera o worker/SMTP.
 */
export class BullMqDeliveryQueue implements DeliveryQueuePort {
  private readonly queue = new Queue<DeliveryRecipientJob>(HOMEWORK_DELIVERY_QUEUE, {
    connection: getRedisConnectionOptions(),
    defaultJobOptions: DELIVERY_JOB_OPTIONS,
  });

  async enqueue(jobs: DeliveryRecipientJob[]): Promise<void> {
    if (jobs.length === 0) return;
    await Promise.all(jobs.map((data) => this.addIgnoringDuplicate(data)));
  }

  private async addIgnoringDuplicate(data: DeliveryRecipientJob): Promise<void> {
    try {
      await this.queue.add("deliver", data, {
        jobId: deliveryJobId(data),
        ...DELIVERY_JOB_OPTIONS,
      });
    } catch (error) {
      if (!isDuplicateJobError(error)) {
        throw error;
      }
    }
  }
}

export function deliveryJobId(job: DeliveryRecipientJob): string {
  return `deliver:${job.deliveryId}:${job.recipientId}`;
}

function isDuplicateJobError(error: unknown): boolean {
  return error instanceof Error && error.message.toLowerCase().includes("already exists");
}
