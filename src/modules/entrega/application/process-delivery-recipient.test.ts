import { ProcessDeliveryRecipient } from "./process-delivery-recipient.js";
import { EmailDeliveryError } from "../domain/errors.js";
import { InMemoryHomeworkRepository } from "../../material/application/test-utils/in-memory-homework-repository.js";
import { InMemoryDeliveryRepository } from "./test-utils/in-memory-delivery-repository.js";
import { InMemoryEmailSender } from "./test-utils/in-memory-email-sender.js";

async function buildScenario() {
  const homeworkRepository = new InMemoryHomeworkRepository();
  const deliveryRepository = new InMemoryDeliveryRepository();
  const emailSender = new InMemoryEmailSender();
  const processDeliveryRecipient = new ProcessDeliveryRecipient(
    deliveryRepository,
    homeworkRepository,
    emailSender,
  );

  const generator = await homeworkRepository.createGenerator({
    title: "Frações",
    content: "Texto",
    classId: "class-1",
    teacherId: "teacher-1",
  });
  const variant = await homeworkRepository.upsertAdaptation({
    title: "Frações (P1)",
    content: "Texto simplificado sobre frações.",
    glossary: [{ term: "Fração", definition: "Parte de um todo." }],
    homeworkId: generator.id,
    learningProfileId: "profile-1",
    classId: "class-1",
    teacherId: "teacher-1",
  });

  const delivery = await deliveryRepository.create({
    homeworkId: generator.id,
    teacherId: "teacher-1",
    recipients: [
      {
        studentId: "student-1",
        studentName: "Lucas",
        studentEmail: "lucas@escola.com",
        variantHomeworkId: variant.id,
        status: "pendente",
        failedReason: null,
      },
    ],
  });

  return { processDeliveryRecipient, emailSender, deliveryRepository, delivery, variant };
}

describe("ProcessDeliveryRecipient", () => {
  it("envia o e-mail e marca o destinatário como enviado", async () => {
    const { processDeliveryRecipient, emailSender, deliveryRepository, delivery } = await buildScenario();
    const recipientId = delivery.recipients[0].id;

    await processDeliveryRecipient.execute({ deliveryId: delivery.id, recipientId });

    expect(emailSender.sent).toHaveLength(1);
    expect(emailSender.sent[0].to).toBe("lucas@escola.com");
    expect(emailSender.sent[0].html).toContain("Texto simplificado sobre frações.");

    const detail = await deliveryRepository.findDetailById(delivery.id);
    const recipient = detail?.recipients.find((r) => r.id === recipientId);
    expect(recipient?.status).toBe("enviado");
    expect(recipient?.sentAt).not.toBeNull();
  });

  it("propaga erro do envio de e-mail sem marcar como enviado", async () => {
    const { processDeliveryRecipient, emailSender, deliveryRepository, delivery } = await buildScenario();
    const recipientId = delivery.recipients[0].id;
    emailSender.failNext(new Error("SMTP indisponível"));

    await expect(
      processDeliveryRecipient.execute({ deliveryId: delivery.id, recipientId }),
    ).rejects.toBeInstanceOf(EmailDeliveryError);

    const detail = await deliveryRepository.findDetailById(delivery.id);
    expect(detail?.recipients[0].status).toBe("pendente");
  });

  it("rejeita quando o destinatário não tem variante adaptada", async () => {
    const { processDeliveryRecipient, deliveryRepository, delivery: baseDelivery } = await buildScenario();
    const delivery = await deliveryRepository.create({
      homeworkId: baseDelivery.homeworkId,
      teacherId: "teacher-1",
      recipients: [
        {
          studentId: "student-2",
          studentName: "Ana",
          studentEmail: "ana@escola.com",
          variantHomeworkId: null,
          status: "pendente",
          failedReason: null,
        },
      ],
    });

    await expect(
      processDeliveryRecipient.execute({ deliveryId: delivery.id, recipientId: delivery.recipients[0].id }),
    ).rejects.toBeInstanceOf(EmailDeliveryError);
  });
});
