import { LearningProfileNotFoundError } from "../../escola/domain/errors.js";
import {
  HomeworkAccessDeniedError,
  HomeworkNotFoundError,
  HomeworkNotGeneratorError,
  InvalidLearningProfilePromptError,
  LlmAdaptationError,
  TtsAdaptationError,
} from "../domain/errors.js";

/**
 * Mensagem estável e legível para o professor no polling de status (BE-E5.10).
 */
export function teacherVisibleAdaptationErrorMessage(error: unknown): string {
  if (error instanceof LlmAdaptationError) {
    return "Falha ao adaptar o texto com a IA. Tente novamente em instantes.";
  }

  if (error instanceof TtsAdaptationError) {
    return "Falha ao gerar o áudio da atividade. Tente novamente em instantes.";
  }

  if (error instanceof InvalidLearningProfilePromptError) {
    return error.message;
  }

  if (error instanceof LearningProfileNotFoundError) {
    return error.message;
  }

  if (error instanceof HomeworkNotFoundError) {
    return error.message;
  }

  if (error instanceof HomeworkNotGeneratorError) {
    return error.message;
  }

  if (error instanceof HomeworkAccessDeniedError) {
    return error.message;
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return "Falha inesperada na adaptação da atividade.";
}
