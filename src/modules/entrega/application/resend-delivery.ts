import { DeliveryNotFoundError } from "../domain/errors.js";
import type { DeliveryRepository } from "../ports/delivery-repository.js";
import type { DeliveryQueuePort } from "../ports/delivery-queue.js";
import { authorizeDeliveryOwner } from "./authorize-delivery-owner.js";

export interface ResendDeliveryResult {
  requeuedCount: number;
}

/**
 * Reenvia apenas os destinatários com status `falhou` (Épico 6, BE-E6.4).
 * Quem já recebeu com sucesso não é afetado.
 */
export class ResendDelivery {
  constructor(
    private readonly deliveryRepository: DeliveryRepository,
    private readonly deliveryQueue: DeliveryQueuePort,
  ) {}

  async execute(deliveryId: string, teacherId: string): Promise<ResendDeliveryResult> {
    await authorizeDeliveryOwner(this.deliveryRepository, deliveryId, teacherId);

    const detail = await this.deliveryRepository.findDetailById(deliveryId);
    if (!detail) {
      throw new DeliveryNotFoundError(deliveryId);
    }

    const failedRecipients = detail.recipients.filter(
      (recipient) => recipient.status === "falhou" && recipient.variantHomeworkId !== null,
    );

    await Promise.all(
      failedRecipients.map((recipient) =>
        this.deliveryRepository.updateRecipientStatus(recipient.id, {
          status: "pendente",
          failedReason: null,
        }),
      ),
    );

    await this.deliveryQueue.enqueue(
      failedRecipients.map((recipient) => ({ deliveryId, recipientId: recipient.id })),
    );

    return { requeuedCount: failedRecipients.length };
  }
}
