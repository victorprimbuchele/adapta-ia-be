import type { DeliveryRecipient } from "../domain/delivery.js";
import type { DeliveryRepository } from "../ports/delivery-repository.js";
import type { HomeworkRepository } from "../../material/ports/homework-repository.js";

/** Lote concluído quando não há destinatários pendentes (Épico 7, BE-E7.7). */
export function isDeliveryBatchComplete(recipients: DeliveryRecipient[]): boolean {
  return recipients.length > 0 && recipients.every((recipient) => recipient.status !== "pendente");
}

/**
 * Atualiza `Sending.status` → `concluido` e `Sending.sent_at` quando o
 * último destinatário do lote atinge estado terminal (`enviado`/`falhou`).
 * Garante também `isDraft = false` na geradora vinculada.
 */
export async function finalizeDeliveryIfComplete(
  deliveryId: string,
  deliveryRepository: DeliveryRepository,
  options?: {
    completedAt?: Date;
    homeworkRepository?: HomeworkRepository;
  },
): Promise<void> {
  const completedAt = options?.completedAt ?? new Date();
  const detail = await deliveryRepository.findDetailById(deliveryId);
  if (!detail || !isDeliveryBatchComplete(detail.recipients)) {
    return;
  }

  if (detail.status !== "concluido" || detail.sentAt === null) {
    await deliveryRepository.updateDelivery(deliveryId, {
      status: "concluido",
      sentAt: completedAt,
    });
  }

  if (options?.homeworkRepository) {
    await options.homeworkRepository.publishGenerator(detail.homeworkId);
  }
}
