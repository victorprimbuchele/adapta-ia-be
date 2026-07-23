import type { Delivery, DeliveryDetail, DeliveryRecipient } from "../../domain/delivery.js";
import type {
  CreateDeliveryData,
  DeliveryRepository,
  UpdateRecipientStatusData,
} from "../../ports/delivery-repository.js";

let nextDeliveryId = 1;
let nextRecipientId = 1;

/**
 * Fake de `DeliveryRepository` em memória (ADR 009 / Épico 6, BE-E6.1).
 */
export class InMemoryDeliveryRepository implements DeliveryRepository {
  readonly deliveries: Delivery[] = [];
  readonly recipientsByDelivery: Map<string, DeliveryRecipient[]> = new Map();

  async create(data: CreateDeliveryData): Promise<DeliveryDetail> {
    const now = new Date();
    const delivery: Delivery = {
      id: `delivery-${nextDeliveryId++}`,
      homeworkId: data.homeworkId,
      teacherId: data.teacherId,
      status: data.status,
      createdAt: now,
      updatedAt: now,
    };
    this.deliveries.push(delivery);

    const recipients: DeliveryRecipient[] = data.recipients.map((r) => ({
      id: `recipient-${nextRecipientId++}`,
      deliveryId: delivery.id,
      studentId: r.studentId,
      studentName: r.studentName,
      studentEmail: r.studentEmail,
      emailPayload: r.emailPayload,
      variantHomeworkId: r.variantHomeworkId,
      status: r.status,
      failedReason: r.failedReason,
      sentAt: null,
      createdAt: now,
      updatedAt: now,
    }));
    this.recipientsByDelivery.set(delivery.id, recipients);

    return { ...delivery, recipients };
  }

  async findById(id: string): Promise<Delivery | null> {
    return this.deliveries.find((d) => d.id === id) ?? null;
  }

  async findDetailById(id: string): Promise<DeliveryDetail | null> {
    const delivery = await this.findById(id);
    if (!delivery) return null;
    return { ...delivery, recipients: this.recipientsByDelivery.get(id) ?? [] };
  }

  async updateRecipientStatus(recipientId: string, data: UpdateRecipientStatusData): Promise<void> {
    for (const recipients of this.recipientsByDelivery.values()) {
      const recipient = recipients.find((r) => r.id === recipientId);
      if (recipient) {
        recipient.status = data.status;
        if (data.failedReason !== undefined) recipient.failedReason = data.failedReason;
        if (data.sentAt !== undefined) recipient.sentAt = data.sentAt;
        recipient.updatedAt = new Date();
        return;
      }
    }
  }
}
