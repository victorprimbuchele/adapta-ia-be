import {
  finalizeDeliveryIfComplete,
  isDeliveryBatchComplete,
} from "./finalize-delivery-if-complete.js";
import type { DeliveryRecipient } from "../domain/delivery.js";
import { InMemoryDeliveryRepository } from "./test-utils/in-memory-delivery-repository.js";

function recipient(
  id: string,
  status: DeliveryRecipient["status"],
): DeliveryRecipient {
  return {
    id,
    deliveryId: "delivery-1",
    studentId: `student-${id}`,
    studentName: "Aluno",
    studentEmail: "aluno@escola.com",
    emailPayload: { homeworkId: "variant-1", title: "Atividade" },
    variantHomeworkId: "variant-1",
    status,
    failedReason: null,
    sentAt: status === "enviado" ? new Date() : null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe("finalizeDeliveryIfComplete (BE-E7.7)", () => {
  it("não finaliza enquanto houver destinatário pendente", async () => {
    const deliveryRepository = new InMemoryDeliveryRepository();
    const created = await deliveryRepository.create({
      homeworkId: "homework-1",
      teacherId: "teacher-1",
      status: "agendado",
      recipients: [
        {
          studentId: "s1",
          studentName: "Lucas",
          studentEmail: "lucas@escola.com",
          emailPayload: { homeworkId: "variant-1", title: "Atividade" },
          variantHomeworkId: "variant-1",
          status: "enviado",
          failedReason: null,
        },
        {
          studentId: "s2",
          studentName: "Ana",
          studentEmail: "ana@escola.com",
          emailPayload: { homeworkId: "variant-2", title: "Atividade" },
          variantHomeworkId: "variant-2",
          status: "pendente",
          failedReason: null,
        },
      ],
    });

    expect(isDeliveryBatchComplete(created.recipients)).toBe(false);

    await finalizeDeliveryIfComplete(created.id, deliveryRepository);

    const detail = await deliveryRepository.findDetailById(created.id);
    expect(detail?.status).toBe("agendado");
    expect(detail?.sentAt).toBeNull();
  });

  it("marca Sending como concluido com sent_at quando o lote termina", async () => {
    const deliveryRepository = new InMemoryDeliveryRepository();
    const completedAt = new Date("2026-07-23T12:00:00.000Z");
    const created = await deliveryRepository.create({
      homeworkId: "homework-1",
      teacherId: "teacher-1",
      status: "agendado",
      recipients: [
        {
          studentId: "s1",
          studentName: "Lucas",
          studentEmail: "lucas@escola.com",
          emailPayload: { homeworkId: "variant-1", title: "Atividade" },
          variantHomeworkId: "variant-1",
          status: "enviado",
          failedReason: null,
        },
        {
          studentId: "s2",
          studentName: "Ana",
          studentEmail: "ana@escola.com",
          emailPayload: { homeworkId: "variant-2", title: "Atividade" },
          variantHomeworkId: "variant-2",
          status: "falhou",
          failedReason: "SMTP indisponível",
        },
      ],
    });

    expect(isDeliveryBatchComplete(created.recipients)).toBe(true);

    await finalizeDeliveryIfComplete(created.id, deliveryRepository, completedAt);

    const detail = await deliveryRepository.findDetailById(created.id);
    expect(detail?.status).toBe("concluido");
    expect(detail?.sentAt).toEqual(completedAt);
  });

  it("considera lote completo com enviado e falhou", () => {
    expect(
      isDeliveryBatchComplete([
        recipient("r1", "enviado"),
        recipient("r2", "falhou"),
      ]),
    ).toBe(true);
  });
});
