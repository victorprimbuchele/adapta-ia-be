import type { Delivery } from "../domain/delivery.js";
import { DeliveryAccessDeniedError, DeliveryNotFoundError } from "../domain/errors.js";
import type { DeliveryRepository } from "../ports/delivery-repository.js";

/**
 * Busca um envio e garante que pertence ao professor autenticado. Reuso
 * em todo use case que leia/modifique um envio específico.
 */
export async function authorizeDeliveryOwner(
  deliveryRepository: DeliveryRepository,
  deliveryId: string,
  teacherId: string,
): Promise<Delivery> {
  const delivery = await deliveryRepository.findById(deliveryId);

  if (!delivery) {
    throw new DeliveryNotFoundError(deliveryId);
  }

  if (delivery.teacherId !== teacherId) {
    throw new DeliveryAccessDeniedError();
  }

  return delivery;
}
