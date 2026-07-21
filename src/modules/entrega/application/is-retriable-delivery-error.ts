import { AppError } from "../../../shared/errors/app-error.js";
import { EmailDeliveryError } from "../domain/errors.js";

/**
 * Decide se a falha de envio deve ser retentada pelo BullMQ (BE-E6.2).
 * - `EmailDeliveryError`: respeita a flag `retriable`.
 * - Demais `AppError` de domínio/validação: não retriáveis.
 * - Erros desconhecidos (rede, SMTP transitório): retriáveis.
 */
export function isRetriableDeliveryError(error: unknown): boolean {
  if (error instanceof EmailDeliveryError) {
    return error.retriable;
  }

  if (error instanceof AppError) {
    return false;
  }

  return true;
}
