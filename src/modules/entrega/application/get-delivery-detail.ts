import type { DeliveryDetailView } from "../domain/delivery.js";
import { DeliveryNotFoundError } from "../domain/errors.js";
import type { DeliveryRepository } from "../ports/delivery-repository.js";
import { authorizeDeliveryOwner } from "./authorize-delivery-owner.js";
import { buildDeliverySummary } from "./build-delivery-summary.js";

/**
 * Status do envio com contagem de sucesso/falha e lista por aluno
 * (Épico 7, BE-E7.9).
 */
export class GetDeliveryDetail {
  constructor(private readonly deliveryRepository: DeliveryRepository) {}

  async execute(deliveryId: string, teacherId: string): Promise<DeliveryDetailView> {
    await authorizeDeliveryOwner(this.deliveryRepository, deliveryId, teacherId);

    const detail = await this.deliveryRepository.findDetailById(deliveryId);
    if (!detail) {
      throw new DeliveryNotFoundError(deliveryId);
    }

    return {
      ...detail,
      summary: buildDeliverySummary(detail.recipients),
    };
  }
}
