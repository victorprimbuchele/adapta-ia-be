import {
  buildSignedFileDownloadUrl,
  resolveFileDownloadSecret,
} from "../../../shared/auth/signed-file-download.js";

/**
 * Link público temporário para o áudio da variante no e-mail de entrega
 * (Épico 7, BE-E7.5). Requer `APP_PUBLIC_URL` e segredo de assinatura.
 */
export function buildDeliveryAudioLink(audioFileId: string): string | null {
  const baseUrl = process.env["APP_PUBLIC_URL"];
  const secret = resolveFileDownloadSecret();
  if (!baseUrl || !secret) {
    return null;
  }

  const apiPrefix = process.env["API_PREFIX"] ?? "/api/v1";
  return buildSignedFileDownloadUrl({
    fileId: audioFileId,
    baseUrl,
    apiPrefix,
    secret,
  });
}
