import type { DeliveryDetail } from "../domain/delivery.js";
import { DeliveryNotFoundError } from "../domain/errors.js";
import type { DeliveryRepository } from "../ports/delivery-repository.js";
import { authorizeDeliveryOwner } from "./authorize-delivery-owner.js";

/**
 * Status do envio, com status por destinatário — para a tela de
 * acompanhamento e reenvio manual (Épico 6, BE-E6.3).
 */
export class GetDeliveryDetail {
  constructor(private readonly deliveryRepository: DeliveryRepository) {}

  async execute(deliveryId: string, teacherId: string): Promise<DeliveryDetail> {
    await authorizeDeliveryOwner(this.deliveryRepository, deliveryId, teacherId);

    const detail = await this.deliveryRepository.findDetailById(deliveryId);
    if (!detail) {
      throw new DeliveryNotFoundError(deliveryId);
    }

    return detail;
  }
}
