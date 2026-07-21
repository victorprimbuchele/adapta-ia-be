/**
 * Envio de uma homework geradora — um e-mail por aluno matriculado na
 * turma com perfil de aprendizagem vinculado (Épico 6, BE-E6.1).
 * Assíncrono: a API cria o registro e enfileira; o worker envia de fato.
 */
export type DeliveryRecipientStatus = "pendente" | "enviado" | "falhou";

export interface Delivery {
  id: string;
  homeworkId: string;
  teacherId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeliveryRecipient {
  id: string;
  deliveryId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  /** Null quando o perfil do aluno não tinha variante adaptada pronta. */
  variantHomeworkId: string | null;
  status: DeliveryRecipientStatus;
  failedReason: string | null;
  sentAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeliveryDetail extends Delivery {
  recipients: DeliveryRecipient[];
}
