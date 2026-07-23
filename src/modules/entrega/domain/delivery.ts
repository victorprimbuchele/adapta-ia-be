/**
 * Envio de uma homework geradora (`Sending` / `Delivery`) — um par
 * HomeworkSending + EmailSending por aluno matriculado na turma com perfil
 * (Épico 7, BE-E7.1 / BE-E7.2). Assíncrono: a API cria os registros e
 * enfileira; o worker envia de fato.
 */
export type DeliveryStatus = "pendente" | "agendado" | "concluido";

export type DeliveryRecipientStatus = "pendente" | "enviado" | "falhou";

/** Snapshot do conteúdo enviado por e-mail (`EmailSending.payload` — BE-E7.4). */
export interface EmailSendingPayload {
  homeworkId: string;
  title: string;
}

export interface Delivery {
  id: string;
  homeworkId: string;
  teacherId: string;
  status: DeliveryStatus;
  /** Preenchido quando todos os destinatários terminaram (`Sending.sent_at` — BE-E7.7). */
  sentAt: Date | null;
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
  /** Snapshot do conteúdo enviado (`EmailSending.payload`). */
  emailPayload: EmailSendingPayload;
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

/** Contagem agregada por status de destinatário (Épico 7, BE-E7.9). */
export interface DeliverySummary {
  total: number;
  enviado: number;
  falhou: number;
  pendente: number;
}

export interface DeliveryDetailView extends DeliveryDetail {
  summary: DeliverySummary;
}
