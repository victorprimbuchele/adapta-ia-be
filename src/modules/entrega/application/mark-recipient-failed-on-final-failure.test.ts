import { UnrecoverableError } from "bullmq";

import {
  isFinalDeliveryJobFailure,
  markRecipientFailedOnFinalFailure,
} from "./mark-recipient-failed-on-final-failure.js";
import { InMemoryDeliveryRepository } from "./test-utils/in-memory-delivery-repository.js";

describe("markRecipientFailedOnFinalFailure (BE-E7.8)", () => {
  it("marca falhou imediatamente em erro permanente (UnrecoverableError)", async () => {
    const deliveryRepository = new InMemoryDeliveryRepository();
    const created = await deliveryRepository.create({
      homeworkId: "homework-1",
      teacherId: "teacher-1",
      status: "agendado",
      recipients: [
        {
          studentId: "s1",
          studentName: "Lucas",
          studentEmail: "email-invalido",
          emailPayload: { homeworkId: "variant-1", title: "Atividade" },
          variantHomeworkId: "variant-1",
          status: "pendente",
          failedReason: null,
        },
      ],
    });
    const recipientId = created.recipients[0].id;

    await markRecipientFailedOnFinalFailure(
      {
        data: { deliveryId: created.id, recipientId },
        attemptsMade: 1,
        opts: { attempts: 3 },
      },
      new UnrecoverableError("Endereço de e-mail inválido."),
      deliveryRepository,
    );

    const detail = await deliveryRepository.findDetailById(created.id);
    expect(detail?.recipients[0].status).toBe("falhou");
    expect(detail?.recipients[0].failedReason).toContain("inválido");
  });

  it("mantém pendente enquanto ainda há retry disponível", async () => {
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
          status: "pendente",
          failedReason: null,
        },
      ],
    });
    const recipientId = created.recipients[0].id;

    await markRecipientFailedOnFinalFailure(
      {
        data: { deliveryId: created.id, recipientId },
        attemptsMade: 1,
        opts: { attempts: 3 },
      },
      new Error("SMTP indisponível"),
      deliveryRepository,
    );

    const detail = await deliveryRepository.findDetailById(created.id);
    expect(detail?.recipients[0].status).toBe("pendente");
  });

  it("marca falhou na última tentativa retriável", async () => {
    expect(
      isFinalDeliveryJobFailure(
        { data: { deliveryId: "d1", recipientId: "r1" }, attemptsMade: 3, opts: { attempts: 3 } },
        new Error("SMTP indisponível"),
      ),
    ).toBe(true);
  });
});
