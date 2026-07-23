import { ProcessDeliveryRecipient } from "./process-delivery-recipient.js";
import { EmailDeliveryError } from "../domain/errors.js";
import { GetFile } from "../../material/application/get-file.js";
import { InMemoryFileRepository } from "../../material/application/test-utils/in-memory-file-repository.js";
import { InMemoryObjectStorage } from "../../material/application/test-utils/in-memory-object-storage.js";
import { InMemoryHomeworkRepository } from "../../material/application/test-utils/in-memory-homework-repository.js";
import { InMemoryDeliveryRepository } from "./test-utils/in-memory-delivery-repository.js";
import { InMemoryEmailSender } from "./test-utils/in-memory-email-sender.js";

async function buildScenario(options?: { withPdf?: boolean }) {
  const withPdf = options?.withPdf ?? true;
  const homeworkRepository = new InMemoryHomeworkRepository();
  const deliveryRepository = new InMemoryDeliveryRepository();
  const emailSender = new InMemoryEmailSender();
  const fileRepository = new InMemoryFileRepository();
  const objectStorage = new InMemoryObjectStorage();
  const getFile = new GetFile(fileRepository, objectStorage);
  const processDeliveryRecipient = new ProcessDeliveryRecipient(
    deliveryRepository,
    homeworkRepository,
    emailSender,
    getFile,
  );

  const generator = await homeworkRepository.createGenerator({
    title: "Frações",
    content: "Texto",
    classId: "class-1",
    teacherId: "teacher-1",
  });
  let variant = await homeworkRepository.upsertAdaptation({
    title: "Frações (P1)",
    content: "Texto simplificado sobre frações.",
    glossary: [{ term: "Fração", definition: "Parte de um todo." }],
    homeworkId: generator.id,
    learningProfileId: "profile-1",
    classId: "class-1",
    teacherId: "teacher-1",
  });

  if (withPdf) {
    const file = await fileRepository.create({
      type: "pdf",
      path: `variants/${variant.id}.pdf`,
      mimeType: "application/pdf",
      sizeBytes: 4,
    });
    await objectStorage.store({ key: file.path, data: Buffer.from("%PDF"), mimeType: "application/pdf" });
    variant = await homeworkRepository.attachContentFile(variant.id, file.id);
  }

  const delivery = await deliveryRepository.create({
    homeworkId: generator.id,
    teacherId: "teacher-1",
    status: "agendado",
    recipients: [
      {
        studentId: "student-1",
        studentName: "Lucas",
        studentEmail: "lucas@escola.com",
        emailPayload: { homeworkId: variant.id, title: variant.title },
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
    expect(emailSender.sent[0].attachments).toHaveLength(1);
    expect(emailSender.sent[0].attachments?.[0]).toMatchObject({
      filename: expect.stringContaining(".pdf"),
      contentType: "application/pdf",
    });
    expect(emailSender.sent[0].attachments?.[0].content.toString()).toBe("%PDF");

    const detail = await deliveryRepository.findDetailById(delivery.id);
    const recipient = detail?.recipients.find((r) => r.id === recipientId);
    expect(recipient?.status).toBe("enviado");
    expect(recipient?.sentAt).not.toBeNull();
  });

  it("rejeita quando a variante não tem PDF gerado", async () => {
    const { processDeliveryRecipient, emailSender, deliveryRepository, delivery } = await buildScenario({
      withPdf: false,
    });
    const recipientId = delivery.recipients[0].id;

    await expect(
      processDeliveryRecipient.execute({ deliveryId: delivery.id, recipientId }),
    ).rejects.toBeInstanceOf(EmailDeliveryError);

    expect(emailSender.sent).toHaveLength(0);
    const detail = await deliveryRepository.findDetailById(delivery.id);
    expect(detail?.recipients[0].status).toBe("pendente");
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
      status: "agendado",
      recipients: [
        {
          studentId: "student-2",
          studentName: "Ana",
          studentEmail: "ana@escola.com",
          emailPayload: { homeworkId: "", title: "" },
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
