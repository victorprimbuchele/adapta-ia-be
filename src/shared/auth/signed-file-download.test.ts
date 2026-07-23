import {
  buildSignedFileDownloadUrl,
  verifySignedFileDownload,
} from "./signed-file-download.js";

describe("signed-file-download", () => {
  const secret = "test-secret";

  it("gera URL assinada verificável", () => {
    const url = buildSignedFileDownloadUrl({
      fileId: "file-audio-1",
      baseUrl: "http://localhost:3000",
      apiPrefix: "/api/v1",
      secret,
      ttlSeconds: 3600,
    });

    const parsed = new URL(url);
    expect(parsed.pathname).toBe("/api/v1/arquivos/file-audio-1/publico");
    const expires = Number(parsed.searchParams.get("expires"));
    const sig = parsed.searchParams.get("sig")!;
    expect(verifySignedFileDownload("file-audio-1", expires, sig, secret)).toBe(true);
  });

  it("rejeita assinatura inválida ou expirada", () => {
    const expired = Math.floor(Date.now() / 1000) - 10;
    expect(verifySignedFileDownload("file-audio-1", expired, "deadbeef", secret)).toBe(false);
    expect(verifySignedFileDownload("file-audio-1", expired + 20, "invalid", secret)).toBe(false);
  });
});
