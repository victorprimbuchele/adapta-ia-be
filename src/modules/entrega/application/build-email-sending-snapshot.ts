import type { EmailSendingPayload } from "../domain/delivery.js";

/**
 * Monta o snapshot persistido no `EmailSending` (`EmailSending.payload` —
 * Épico 7, BE-E7.4).
 */
export function buildEmailSendingSnapshot(variant: {
  id: string;
  title: string;
}): EmailSendingPayload {
  return {
    homeworkId: variant.id,
    title: variant.title,
  };
}
