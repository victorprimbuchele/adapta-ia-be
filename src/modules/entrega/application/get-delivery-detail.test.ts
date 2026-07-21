import { GetDeliveryDetail } from "./get-delivery-detail.js";
import { DeliveryAccessDeniedError, DeliveryNotFoundError } from "../domain/errors.js";
import { InMemoryDeliveryRepository } from "./test-utils/in-memory-delivery-repository.js";

describe("GetDeliveryDetail", () => {
  it("retorna o envio com status por destinatário", async () => {
    const deliveryRepository = new InMemoryDeliveryRepository();
    const getDeliveryDetail = new GetDeliveryDetail(deliveryRepository);
    const created = await deliveryRepository.create({
      homeworkId: "homework-1",
      teacherId: "teacher-1",
      recipients: [
        {
          studentId: "s1",
          studentName: "Lucas",
          studentEmail: "lucas@escola.com",
          variantHomeworkId: "variant-1",
          status: "enviado",
          failedReason: null,
        },
      ],
    });

    const detail = await getDeliveryDetail.execute(created.id, "teacher-1");

    expect(detail.recipients).toHaveLength(1);
    expect(detail.recipients[0].status).toBe("enviado");
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
      recipients: [],
    });

    await expect(getDeliveryDetail.execute(created.id, "teacher-2")).rejects.toBeInstanceOf(
      DeliveryAccessDeniedError,
    );
  });
});
