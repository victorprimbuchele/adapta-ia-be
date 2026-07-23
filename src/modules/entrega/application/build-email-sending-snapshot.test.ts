import { buildEmailSendingSnapshot } from "./build-email-sending-snapshot.js";

describe("buildEmailSendingSnapshot (BE-E7.4)", () => {
  it("captura homework_id e título da variante no momento do envio", () => {
    expect(
      buildEmailSendingSnapshot({ id: "variant-1", title: "Frações (P1)" }),
    ).toEqual({
      homeworkId: "variant-1",
      title: "Frações (P1)",
    });
  });
});
