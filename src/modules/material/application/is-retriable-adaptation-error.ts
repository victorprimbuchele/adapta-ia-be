import { AppError } from "../../../shared/errors/app-error.js";
import {
  LlmAdaptationError,
  TtsAdaptationError,
} from "../domain/errors.js";

/**
 * Decide se a falha de adaptação deve ser retentada pelo BullMQ (BE-E5.10).
 * - LLM/TTS: respeitam a flag `retriable` do erro.
 * - Demais `AppError` de domínio/validação: não retriáveis.
 * - Erros desconhecidos (rede, etc.): retriáveis.
 */
export function isRetriableAdaptationError(error: unknown): boolean {
  if (error instanceof LlmAdaptationError || error instanceof TtsAdaptationError) {
    return error.retriable;
  }

  if (error instanceof AppError) {
    return false;
  }

  return true;
}

/** HTTP statuses considerados transitórios para LLM/TTS. */
export function isRetriableHttpStatus(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}
