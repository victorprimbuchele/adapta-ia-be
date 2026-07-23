import { UnrecoverableError } from "bullmq";

import { ProcessDeliveryRecipient } from "./process-delivery-recipient.js";
import { markRecipientFailedOnFinalFailure } from "./mark-recipient-failed-on-final-failure.js";
import { toDeliveryJobError } from "./to-delivery-job-error.js";
import { EmailDeliveryError } from "../domain/errors.js";
import { GetFile } from "../../material/application/get-file.js";
import { InMemoryFileRepository } from "../../material/application/test-utils/in-memory-file-repository.js";
import { InMemoryObjectStorage } from "../../material/application/test-utils/in-memory-object-storage.js";
import { InMemoryHomeworkRepository } from "../../material/application/test-utils/in-memory-homework-repository.js";
import { InMemoryDeliveryRepository } from "./test-utils/in-memory-delivery-repository.js";
import { InMemoryEmailSender } from "./test-utils/in-memory-email-sender.js";

const originalEnv = process.env;

describe("isolamento de falha por destinatário (BE-E7.8)", () => {
  beforeEach(() => {
    process.env = {
      ...originalEnv,
      APP_PUBLIC_URL: "http://localhost:3000",
      API_PREFIX: "/api/v1",
      JWT_SECRET: "test-secret",
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("falha de um e-mail não impede envio dos demais no lote", async () => {
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
      content: "Texto adaptado.",
      glossary: null,
      homeworkId: generator.id,
      learningProfileId: "profile-1",
      classId: "class-1",
      teacherId: "teacher-1",
    });
    const pdfFile = await fileRepository.create({
      type: "pdf",
      path: `variants/${variant.id}.pdf`,
      mimeType: "application/pdf",
      sizeBytes: 4,
    });
    await objectStorage.store({ key: pdfFile.path, data: Buffer.from("%PDF"), mimeType: "application/pdf" });
    variant = await homeworkRepository.attachContentFile(variant.id, pdfFile.id);

    const delivery = await deliveryRepository.create({
      homeworkId: generator.id,
      teacherId: "teacher-1",
      status: "agendado",
      recipients: [
        {
          studentId: "s1",
          studentName: "Lucas",
          studentEmail: "lucas@escola.com",
          emailPayload: { homeworkId: variant.id, title: variant.title },
          variantHomeworkId: variant.id,
          status: "pendente",
          failedReason: null,
        },
        {
          studentId: "s2",
          studentName: "Ana",
          studentEmail: "ana@escola.com",
          emailPayload: { homeworkId: variant.id, title: variant.title },
          variantHomeworkId: variant.id,
          status: "pendente",
          failedReason: null,
        },
      ],
    });

    const [lucas, ana] = delivery.recipients;

    emailSender.failNext(new EmailDeliveryError("Endereço de e-mail inválido.", { retriable: false }));

    await expect(
      processDeliveryRecipient.execute({ deliveryId: delivery.id, recipientId: lucas.id }),
    ).rejects.toBeInstanceOf(EmailDeliveryError);

    const permanentError = toDeliveryJobError(
      new EmailDeliveryError("Endereço de e-mail inválido.", { retriable: false }),
    );
    await markRecipientFailedOnFinalFailure(
      {
        data: { deliveryId: delivery.id, recipientId: lucas.id },
        attemptsMade: 1,
        opts: { attempts: 3 },
      },
      permanentError,
      deliveryRepository,
    );

    await processDeliveryRecipient.execute({ deliveryId: delivery.id, recipientId: ana.id });

    const detail = await deliveryRepository.findDetailById(delivery.id);
    const lucasAfter = detail!.recipients.find((recipient) => recipient.id === lucas.id)!;
    const anaAfter = detail!.recipients.find((recipient) => recipient.id === ana.id)!;

    expect(lucasAfter.status).toBe("falhou");
    expect(lucasAfter.failedReason).toContain("inválido");
    expect(anaAfter.status).toBe("enviado");
    expect(emailSender.sent).toHaveLength(1);
    expect(emailSender.sent[0].to).toBe("ana@escola.com");
  });
});
