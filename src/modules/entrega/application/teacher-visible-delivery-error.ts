import { EmailDeliveryError } from "../domain/errors.js";

/**
 * Mensagem estável e legível para o professor no status do envio (BE-E6.2).
 */
export function teacherVisibleDeliveryErrorMessage(error: unknown): string {
  if (error instanceof EmailDeliveryError) {
    return "Falha ao enviar o e-mail. Tente novamente em instantes.";
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return "Falha inesperada no envio da atividade.";
}
