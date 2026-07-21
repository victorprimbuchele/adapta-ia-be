/**
 * Payload enfileirado para enviar o e-mail de um destinatário
 * (Épico 6, BE-E6.1 / BE-E6.2).
 */
export interface DeliveryRecipientJob {
  deliveryId: string;
  recipientId: string;
}

/**
 * Porta de enfileiramento de envios. A API só adiciona jobs e retorna
 * (202); o worker consome a fila sem bloquear a resposta HTTP no SMTP.
 */
export interface DeliveryQueuePort {
  enqueue(jobs: DeliveryRecipientJob[]): Promise<void>;
}

/** Nome estável da fila BullMQ de envio de homework (BE-E6.2). */
export const HOMEWORK_DELIVERY_QUEUE = "homework-delivery";
