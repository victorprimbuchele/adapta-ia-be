import { GetDeliveryDetail } from "./get-delivery-detail.js";
import { DeliveryAccessDeniedError, DeliveryNotFoundError } from "../domain/errors.js";
import { InMemoryDeliveryRepository } from "./test-utils/in-memory-delivery-repository.js";

describe("GetDeliveryDetail", () => {
  it("retorna o envio com status por destinatário e contagem agregada (BE-E7.9)", async () => {
    const deliveryRepository = new InMemoryDeliveryRepository();
    const getDeliveryDetail = new GetDeliveryDetail(deliveryRepository);
    const created = await deliveryRepository.create({
      homeworkId: "homework-1",
      teacherId: "teacher-1",
      status: "agendado",
      recipients: [
        {
          studentId: "s1",
          studentName: "Lucas",
          studentEmail: "lucas@escola.com",
          emailPayload: { homeworkId: "variant-1", title: "Atividade adaptada" },
          variantHomeworkId: "variant-1",
          status: "enviado",
          failedReason: null,
        },
        {
          studentId: "s2",
          studentName: "Ana",
          studentEmail: "ana@escola.com",
          emailPayload: { homeworkId: "variant-2", title: "Atividade adaptada" },
          variantHomeworkId: "variant-2",
          status: "falhou",
          failedReason: "Endereço inválido",
        },
        {
          studentId: "s3",
          studentName: "João",
          studentEmail: "joao@escola.com",
          emailPayload: { homeworkId: "variant-3", title: "Atividade adaptada" },
          variantHomeworkId: "variant-3",
          status: "pendente",
          failedReason: null,
        },
      ],
    });

    const detail = await getDeliveryDetail.execute(created.id, "teacher-1");

    expect(detail.recipients).toHaveLength(3);
    expect(detail.summary).toEqual({
      total: 3,
      enviado: 1,
      falhou: 1,
      pendente: 1,
    });
    expect(detail.recipients.find((r) => r.studentName === "Lucas")?.status).toBe("enviado");
    expect(detail.recipients.find((r) => r.studentName === "Ana")?.status).toBe("falhou");
    expect(detail.recipients.find((r) => r.studentName === "João")?.status).toBe("pendente");
  });

  it("rejeita quando o envio não existe", async () => {
    const deliveryRepository = new InMemoryDeliveryRepository();
    const getDeliveryDetail = new GetDeliveryDetail(deliveryRepository);

    await expect(getDeliveryDetail.execute("delivery-inexistente", "teacher-1")).rejects.toBeInstanceOf(
      DeliveryNotFoundError,
    );
  });

  it("nega acesso quando o envio pertence a outro professor", async () => {
    const deliveryRepository = new InMemoryDeliveryRepository();
    const getDeliveryDetail = new GetDeliveryDetail(deliveryRepository);
    const created = await deliveryRepository.create({
      homeworkId: "homework-1",
      teacherId: "teacher-1",
      status: "agendado",
      recipients: [],
    });

    await expect(getDeliveryDetail.execute(created.id, "teacher-2")).rejects.toBeInstanceOf(
      DeliveryAccessDeniedError,
    );
  });
});
