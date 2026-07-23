import { ResendDelivery } from "./resend-delivery.js";
import { InMemoryDeliveryQueue } from "./test-utils/in-memory-delivery-queue.js";
import { InMemoryDeliveryRepository } from "./test-utils/in-memory-delivery-repository.js";

describe("ResendDelivery (BE-E7.10 / BE-E7.11)", () => {
  it("reenvio afeta apenas destinatários falhos; quem já recebeu não é reenfileirado (BE-E7.11)", async () => {
    const deliveryRepository = new InMemoryDeliveryRepository();
    const deliveryQueue = new InMemoryDeliveryQueue();
    const resendDelivery = new ResendDelivery(deliveryRepository, deliveryQueue);

    const created = await deliveryRepository.create({
      homeworkId: "homework-1",
      teacherId: "teacher-1",
      status: "agendado",
      recipients: [
        {
          studentId: "s1",
          studentName: "Lucas",
          studentEmail: "lucas@escola.com",
          emailPayload: { homeworkId: "variant-1", title: "Variante 1" },
          variantHomeworkId: "variant-1",
          status: "enviado",
          failedReason: null,
        },
        {
          studentId: "s2",
          studentName: "Ana",
          studentEmail: "ana@escola.com",
          emailPayload: { homeworkId: "variant-2", title: "Variante 2" },
          variantHomeworkId: "variant-2",
          status: "falhou",
          failedReason: "Falha ao enviar o e-mail.",
        },
        {
          studentId: "s3",
          studentName: "João",
          studentEmail: "joao@escola.com",
          emailPayload: { homeworkId: "", title: "" },
          variantHomeworkId: null,
          status: "falhou",
          failedReason: "Adaptação não disponível.",
        },
      ],
    });

    const result = await resendDelivery.execute(created.id, "teacher-1");

    expect(result.requeuedCount).toBe(1);
    expect(deliveryQueue.enqueued).toHaveLength(1);
    expect(deliveryQueue.enqueued).toEqual([{ deliveryId: created.id, recipientId: created.recipients[1].id }]);
    expect(deliveryQueue.enqueued.some((job) => job.recipientId === created.recipients[0].id)).toBe(false);

    const detail = await deliveryRepository.findDetailById(created.id);
    expect(detail?.recipients.find((r) => r.studentId === "s2")?.status).toBe("pendente");
    expect(detail?.recipients.find((r) => r.studentId === "s1")?.status).toBe("enviado");
    expect(detail?.recipients.find((r) => r.studentId === "s1")?.sentAt).toBeNull();
    expect(detail?.recipients.find((r) => r.studentId === "s3")?.status).toBe("falhou");
  });

  it("retorna requeuedCount 0 quando não há falhos reenviáveis", async () => {
    const deliveryRepository = new InMemoryDeliveryRepository();
    const deliveryQueue = new InMemoryDeliveryQueue();
    const resendDelivery = new ResendDelivery(deliveryRepository, deliveryQueue);

    const created = await deliveryRepository.create({
      homeworkId: "homework-1",
      teacherId: "teacher-1",
      status: "concluido",
      recipients: [
        {
          studentId: "s1",
          studentName: "Lucas",
          studentEmail: "lucas@escola.com",
          emailPayload: { homeworkId: "variant-1", title: "Variante 1" },
          variantHomeworkId: "variant-1",
          status: "enviado",
          failedReason: null,
        },
      ],
    });

    const result = await resendDelivery.execute(created.id, "teacher-1");

    expect(result.requeuedCount).toBe(0);
    expect(deliveryQueue.enqueued).toHaveLength(0);
  });
});
