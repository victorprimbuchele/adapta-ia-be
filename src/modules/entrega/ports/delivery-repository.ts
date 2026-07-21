import type { Delivery, DeliveryDetail, DeliveryRecipientStatus } from "../domain/delivery.js";

export interface CreateRecipientData {
  studentId: string;
  studentName: string;
  studentEmail: string;
  /** Null quando o perfil do aluno não tinha variante pronta (falha imediata). */
  variantHomeworkId: string | null;
  status: DeliveryRecipientStatus;
  failedReason: string | null;
}

export interface CreateDeliveryData {
  homeworkId: string;
  teacherId: string;
  recipients: CreateRecipientData[];
}

export interface UpdateRecipientStatusData {
  status: DeliveryRecipientStatus;
  failedReason?: string | null;
  sentAt?: Date | null;
}

export interface DeliveryRepository {
  /** Cria o envio e todos os destinatários em uma única transação. */
  create(data: CreateDeliveryData): Promise<DeliveryDetail>;

  findById(id: string): Promise<Delivery | null>;

  findDetailById(id: string): Promise<DeliveryDetail | null>;

  updateRecipientStatus(recipientId: string, data: UpdateRecipientStatusData): Promise<void>;
}
