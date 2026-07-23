import crypto from "node:crypto";

const DEFAULT_TTL_SECONDS = 7 * 24 * 60 * 60;

function signFileDownload(fileId: string, expires: number, secret: string): string {
  return crypto.createHmac("sha256", secret).update(`${fileId}:${expires}`).digest("hex");
}

/**
 * Gera URL pública temporária para download de arquivo (ex.: áudio TTS no
 * e-mail de entrega — Épico 7, BE-E7.5).
 */
export function buildSignedFileDownloadUrl(input: {
  fileId: string;
  baseUrl: string;
  apiPrefix: string;
  secret: string;
  ttlSeconds?: number;
}): string {
  const expires = Math.floor(Date.now() / 1000) + (input.ttlSeconds ?? DEFAULT_TTL_SECONDS);
  const signature = signFileDownload(input.fileId, expires, input.secret);
  const normalizedBase = input.baseUrl.replace(/\/$/, "");
  const normalizedPrefix = input.apiPrefix.startsWith("/") ? input.apiPrefix : `/${input.apiPrefix}`;
  const url = new URL(`${normalizedBase}${normalizedPrefix}/arquivos/${input.fileId}/publico`);
  url.searchParams.set("expires", String(expires));
  url.searchParams.set("sig", signature);
  return url.toString();
}

export function verifySignedFileDownload(
  fileId: string,
  expires: number,
  signature: string,
  secret: string,
): boolean {
  if (!Number.isFinite(expires) || expires < Math.floor(Date.now() / 1000)) {
    return false;
  }

  const expected = signFileDownload(fileId, expires, secret);
  if (expected.length !== signature.length) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export function resolveFileDownloadSecret(): string | null {
  return process.env["FILE_DOWNLOAD_SECRET"] ?? process.env["JWT_SECRET"] ?? null;
}
