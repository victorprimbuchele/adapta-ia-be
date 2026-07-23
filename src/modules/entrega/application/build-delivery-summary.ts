import type { DeliveryRecipient, DeliverySummary } from "../domain/delivery.js";

/** Agrega contagem de sucesso/falha/pendente por aluno (Épico 7, BE-E7.9). */
export function buildDeliverySummary(recipients: DeliveryRecipient[]): DeliverySummary {
  let enviado = 0;
  let falhou = 0;
  let pendente = 0;

  for (const recipient of recipients) {
    switch (recipient.status) {
      case "enviado":
        enviado += 1;
        break;
      case "falhou":
        falhou += 1;
        break;
      case "pendente":
        pendente += 1;
        break;
    }
  }

  return {
    total: recipients.length,
    enviado,
    falhou,
    pendente,
  };
}
