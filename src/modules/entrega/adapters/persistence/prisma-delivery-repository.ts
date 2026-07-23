import type { PrismaClient } from "../../../../generated/prisma/client.js";
import type { Delivery, DeliveryDetail, DeliveryRecipient } from "../../domain/delivery.js";
import type {
  CreateDeliveryData,
  DeliveryRepository,
  UpdateRecipientStatusData,
} from "../../ports/delivery-repository.js";

/**
 * Implementação de `DeliveryRepository` sobre as tabelas `deliveries` /
 * `delivery_recipients` (Épico 6, BE-E6.1).
 */
export class PrismaDeliveryRepository implements DeliveryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateDeliveryData): Promise<DeliveryDetail> {
    const row = await this.prisma.delivery.create({
      data: {
        homeworkId: data.homeworkId,
        teacherId: data.teacherId,
        status: data.status,
        recipients: {
          create: data.recipients.map((r) => ({
            studentId: r.studentId,
            studentName: r.studentName,
            studentEmail: r.studentEmail,
            variantHomeworkId: r.variantHomeworkId,
            status: r.status,
            failedReason: r.failedReason,
          })),
        },
      },
      include: { recipients: true },
    });

    return toDeliveryDetail(row);
  }

  async findById(id: string): Promise<Delivery | null> {
    const row = await this.prisma.delivery.findUnique({ where: { id } });
    return row ? toDelivery(row) : null;
  }

  async findDetailById(id: string): Promise<DeliveryDetail | null> {
    const row = await this.prisma.delivery.findUnique({
      where: { id },
      include: { recipients: true },
    });
    return row ? toDeliveryDetail(row) : null;
  }

  async updateRecipientStatus(recipientId: string, data: UpdateRecipientStatusData): Promise<void> {
    await this.prisma.deliveryRecipient.update({
      where: { id: recipientId },
      data: {
        status: data.status,
        ...(data.failedReason !== undefined ? { failedReason: data.failedReason } : {}),
        ...(data.sentAt !== undefined ? { sentAt: data.sentAt } : {}),
      },
    });
  }
}

interface DeliveryRow {
  id: string;
  homeworkId: string;
  teacherId: string;
  status: Delivery["status"];
  createdAt: Date;
  updatedAt: Date;
}

interface DeliveryRecipientRow {
  id: string;
  deliveryId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  variantHomeworkId: string | null;
  status: DeliveryRecipient["status"];
  failedReason: string | null;
  sentAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

function toDelivery(row: DeliveryRow): Delivery {
  return {
    id: row.id,
    homeworkId: row.homeworkId,
    teacherId: row.teacherId,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toDeliveryDetail(row: DeliveryRow & { recipients: DeliveryRecipientRow[] }): DeliveryDetail {
  return { ...toDelivery(row), recipients: row.recipients.map(toDeliveryRecipient) };
}

function toDeliveryRecipient(row: DeliveryRecipientRow): DeliveryRecipient {
  return {
    id: row.id,
    deliveryId: row.deliveryId,
    studentId: row.studentId,
    studentName: row.studentName,
    studentEmail: row.studentEmail,
    variantHomeworkId: row.variantHomeworkId,
    status: row.status,
    failedReason: row.failedReason,
    sentAt: row.sentAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
