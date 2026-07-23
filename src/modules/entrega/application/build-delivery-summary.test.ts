import { buildDeliverySummary } from "./build-delivery-summary.js";

describe("buildDeliverySummary (BE-E7.9)", () => {
  it("conta enviados, falhos e pendentes", () => {
    expect(
      buildDeliverySummary([
        {
          id: "r1",
          deliveryId: "d1",
          studentId: "s1",
          studentName: "Lucas",
          studentEmail: "lucas@escola.com",
          emailPayload: { homeworkId: "v1", title: "A" },
          variantHomeworkId: "v1",
          status: "enviado",
          failedReason: null,
          sentAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "r2",
          deliveryId: "d1",
          studentId: "s2",
          studentName: "Ana",
          studentEmail: "ana@escola.com",
          emailPayload: { homeworkId: "v2", title: "B" },
          variantHomeworkId: "v2",
          status: "falhou",
          failedReason: "SMTP",
          sentAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "r3",
          deliveryId: "d1",
          studentId: "s3",
          studentName: "João",
          studentEmail: "joao@escola.com",
          emailPayload: { homeworkId: "v3", title: "C" },
          variantHomeworkId: "v3",
          status: "pendente",
          failedReason: null,
          sentAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]),
    ).toEqual({
      total: 3,
      enviado: 1,
      falhou: 1,
      pendente: 1,
    });
  });
});
