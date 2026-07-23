import { EmailDeliveryError } from "../domain/errors.js";
import type { GetFile } from "../../material/application/get-file.js";
import { buildPdfFilename } from "../../material/application/get-homework-variant-pdf.js";
import type { HomeworkRepository } from "../../material/ports/homework-repository.js";
import type { DeliveryRepository } from "../ports/delivery-repository.js";
import type { EmailAttachment, EmailSenderPort } from "../ports/email-sender.js";
import { buildDeliveryAudioLink } from "./build-delivery-audio-link.js";
import { finalizeDeliveryIfComplete } from "./finalize-delivery-if-complete.js";
import { renderDeliveryEmail } from "./render-delivery-email.js";

export interface ProcessDeliveryRecipientInput {
  deliveryId: string;
  recipientId: string;
}

/**
 * Processa o envio de um único destinatário (worker — Épico 7, BE-E7.5 /
 * BE-E7.8): job isolado na fila; falha aqui não afeta os demais alunos.
 */
export class ProcessDeliveryRecipient {
  constructor(
    private readonly deliveryRepository: DeliveryRepository,
    private readonly homeworkRepository: HomeworkRepository,
    private readonly emailSender: EmailSenderPort,
    private readonly getFile: GetFile,
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

    if (!variant.contentFileId) {
      throw new EmailDeliveryError("Variante adaptada sem PDF gerado.", { retriable: false });
    }

    const attachment = await this.buildPdfAttachment(variant.contentFileId, variant.title);
    const audioUrl = variant.audioFileId ? buildDeliveryAudioLink(variant.audioFileId) : null;

    const email = renderDeliveryEmail({
      studentName: recipient.studentName,
      homeworkTitle: variant.title,
      variantContent: variant.content,
      glossary: variant.glossary,
      audioUrl,
    });

    try {
      await this.emailSender.send({
        to: recipient.studentEmail,
        subject: email.subject,
        html: email.html,
        attachments: [attachment],
      });
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

    await finalizeDeliveryIfComplete(input.deliveryId, this.deliveryRepository, {
      homeworkRepository: this.homeworkRepository,
    });
  }

  private async buildPdfAttachment(fileId: string, title: string): Promise<EmailAttachment> {
    try {
      const { file, data } = await this.getFile.execute(fileId);
      return { filename: buildPdfFilename(title), content: data, contentType: file.mimeType };
    } catch (error) {
      throw new EmailDeliveryError(
        error instanceof Error ? `Falha ao carregar o PDF da atividade: ${error.message}` : "Falha ao carregar o PDF da atividade.",
        { retriable: false },
      );
    }
  }
}
