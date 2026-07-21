import type { DeliveryQueuePort, DeliveryRecipientJob } from "../../ports/delivery-queue.js";

/**
 * Fake de `DeliveryQueuePort` em memória (ADR 009 / Épico 6, BE-E6.2).
 */
export class InMemoryDeliveryQueue implements DeliveryQueuePort {
  readonly enqueued: DeliveryRecipientJob[] = [];

  async enqueue(jobs: DeliveryRecipientJob[]): Promise<void> {
    this.enqueued.push(...jobs);
  }
}
