import { buildDeliveryAudioLink } from "./build-delivery-audio-link.js";

describe("buildDeliveryAudioLink (BE-E7.5)", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env["APP_PUBLIC_URL"] = "http://localhost:3000";
    process.env["API_PREFIX"] = "/api/v1";
    process.env["JWT_SECRET"] = "test-secret";
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("retorna URL assinada quando APP_PUBLIC_URL está configurada", () => {
    const link = buildDeliveryAudioLink("file-audio-1");
    expect(link).toContain("/api/v1/arquivos/file-audio-1/publico");
    expect(link).toContain("sig=");
  });

  it("retorna null sem APP_PUBLIC_URL", () => {
    delete process.env["APP_PUBLIC_URL"];
    expect(buildDeliveryAudioLink("file-audio-1")).toBeNull();
  });
});
