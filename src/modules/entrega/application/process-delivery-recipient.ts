import { EmailDeliveryError } from "../domain/errors.js";
import type { HomeworkRepository } from "../../material/ports/homework-repository.js";
import type { DeliveryRepository } from "../ports/delivery-repository.js";
import type { EmailSenderPort } from "../ports/email-sender.js";
import { renderDeliveryEmail } from "./render-delivery-email.js";

export interface ProcessDeliveryRecipientInput {
  deliveryId: string;
  recipientId: string;
}

/**
 * Processa o envio de um único destinatário (worker — Épico 6, BE-E6.2):
 * carrega a variante adaptada, monta o e-mail e envia via SMTP. Atualiza
 * o status do destinatário para `enviado`/`falhou` ao final.
 */
export class ProcessDeliveryRecipient {
  constructor(
    private readonly deliveryRepository: DeliveryRepository,
    private readonly homeworkRepository: HomeworkRepository,
    private readonly emailSender: EmailSenderPort,
  ) {}

  async execute(input: ProcessDeliveryRecipientInput): Promise<void> {
    const detail = await this.deliveryRepository.findDetailById(input.deliveryId);
    if (!detail) {
      throw new EmailDeliveryError(`Envio "${input.deliveryId}" não encontrado.`, { retriable: false });
    }

    const recipient = detail.recipients.find((r) => r.id === input.recipientId);
    if (!recipient) {
      throw new EmailDeliveryError(`Destinatário "${input.recipientId}" não encontrado.`, {
        retriable: false,
      });
    }

    if (!recipient.variantHomeworkId) {
      throw new EmailDeliveryError("Destinatário sem variante adaptada disponível.", {
        retriable: false,
      });
    }

    const variant = await this.homeworkRepository.findById(recipient.variantHomeworkId);
    if (!variant) {
      throw new EmailDeliveryError("Variante adaptada não encontrada.", { retriable: false });
    }

    const email = renderDeliveryEmail({
      studentName: recipient.studentName,
      homeworkTitle: variant.title,
      variantContent: variant.content,
      glossary: variant.glossary,
    });

    try {
      await this.emailSender.send({ to: recipient.studentEmail, subject: email.subject, html: email.html });
    } catch (error) {
      throw new EmailDeliveryError(
        error instanceof Error ? error.message : "Falha ao enviar o e-mail.",
      );
    }

    await this.deliveryRepository.updateRecipientStatus(recipient.id, {
      status: "enviado",
      sentAt: new Date(),
      failedReason: null,
    });
  }
}
