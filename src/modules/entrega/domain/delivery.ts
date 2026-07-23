/**
 * Envio de uma homework geradora (`Sending` / `Delivery`) — um par
 * HomeworkSending + EmailSending por aluno matriculado na turma com perfil
 * (Épico 7, BE-E7.1 / BE-E7.2). Assíncrono: a API cria os registros e
 * enfileira; o worker envia de fato.
 */
export type DeliveryStatus = "pendente" | "agendado";

export type DeliveryRecipientStatus = "pendente" | "enviado" | "falhou";

export interface Delivery {
  id: string;
  homeworkId: string;
  teacherId: string;
  status: DeliveryStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Destinatário individual — materializa **HomeworkSending** (variante do perfil)
 * e **EmailSending** (snapshot de e-mail + status de envio) no mesmo registro
 * (`delivery_recipients`), um por aluno (Épico 7, BE-E7.2).
 */
export interface DeliveryRecipient {
  id: string;
  deliveryId: string;
  studentId: string;
  studentName: string;
  /** Snapshot do e-mail no momento do envio (`EmailSending.recipient_email`). */
  studentEmail: string;
  /** Variante adaptada do perfil do aluno (`HomeworkSending.variant_homework_id`). */
  variantHomeworkId: string | null;
  /** Status do envio de e-mail (`EmailSending.status`). */
  status: DeliveryRecipientStatus;
  failedReason: string | null;
  sentAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeliveryDetail extends Delivery {
  recipients: DeliveryRecipient[];
}
