import { AppError } from "../../../shared/errors/app-error.js";

/**
 * Teacher informed when creating a homework does not match any existing
 * user (Epic 4, BE-E4.1).
 */
export class TeacherNotFoundError extends AppError {
  constructor(teacherId: string) {
    super(`Professor "${teacherId}" não encontrado.`, 404, "TEACHER_NOT_FOUND");
  }
}

/**
 * Homework informed does not exist (Epic 4, BE-E4.3).
 */
export class HomeworkNotFoundError extends AppError {
  constructor(homeworkId: string) {
    super(`Homework "${homeworkId}" não encontrada.`, 404, "HOMEWORK_NOT_FOUND");
  }
}

/**
 * Homework exists, but does not belong to the authenticated teacher
 * (Epic 4, BE-E4.3).
 */
export class HomeworkAccessDeniedError extends AppError {
  constructor() {
    super(
      "Você não tem permissão para acessar esta homework.",
      403,
      "HOMEWORK_ACCESS_DENIED",
    );
  }
}

/**
 * Only drafts can be edited via PATCH (Epic 4, BE-E4.3).
 */
export class HomeworkNotDraftError extends AppError {
  constructor(homeworkId: string) {
    super(
      `Homework "${homeworkId}" não é um rascunho e não pode ser editada.`,
      409,
      "HOMEWORK_NOT_DRAFT",
    );
  }
}

/**
 * Only generator homeworks can be adapted (Epic 5, BE-E5.1).
 */
export class HomeworkNotGeneratorError extends AppError {
  constructor(homeworkId: string) {
    super(
      `Homework "${homeworkId}" não é uma geradora e não pode ser adaptada.`,
      409,
      "HOMEWORK_NOT_GENERATOR",
    );
  }
}

/**
 * No learning profiles available to enqueue adaptations for (Epic 5, BE-E5.1).
 */
export class NoLearningProfilesToAdaptError extends AppError {
  constructor(homeworkId: string) {
    super(
      `Nenhum perfil de aprendizagem disponível para adaptar a homework "${homeworkId}".`,
      422,
      "NO_LEARNING_PROFILES_TO_ADAPT",
    );
  }
}

/**
 * `LearningProfile.prompt` no banco não segue o shape esperado pela skill
 * de adaptação (Epic 5, BE-E5.3).
 */
export class InvalidLearningProfilePromptError extends AppError {
  constructor(learningProfileId: string) {
    super(
      `Prompt do perfil de aprendizagem "${learningProfileId}" é inválido.`,
      422,
      "INVALID_LEARNING_PROFILE_PROMPT",
    );
  }
}

/**
 * Falha na chamada ou no parse da resposta da LLM (Epic 5, BE-E5.3 / BE-E5.10).
 * Por padrão é retriável (5xx/429/resposta transitória); erros 4xx de cliente
 * devem passar `retriable: false`.
 */
export class LlmAdaptationError extends AppError {
  readonly retriable: boolean;

  constructor(message: string, options?: { retriable?: boolean }) {
    super(message, 502, "LLM_ADAPTATION_FAILED");
    this.retriable = options?.retriable ?? true;
  }
}

/**
 * Falha na chamada à API de TTS (Epic 5, BE-E5.6 / BE-E5.10).
 * Por padrão é retriável; falhas de validação local usam `retriable: false`.
 */
export class TtsAdaptationError extends AppError {
  readonly retriable: boolean;

  constructor(message: string, options?: { retriable?: boolean }) {
    super(message, 502, "TTS_ADAPTATION_FAILED");
    this.retriable = options?.retriable ?? true;
  }
}

/**
 * Arquivo (ex.: áudio TTS de uma variante) não encontrado (Épico 5, BE-E5.7).
 */
export class FileNotFoundError extends AppError {
  constructor(fileId: string) {
    super(`Arquivo "${fileId}" não encontrado.`, 404, "FILE_NOT_FOUND");
  }
}

/**
 * PDF da variante ainda não foi gerado ou não existe (Épico 6, BE-E6.3).
 */
export class HomeworkPdfNotFoundError extends AppError {
  constructor(homeworkId: string) {
    super(
      `PDF da homework "${homeworkId}" não está disponível.`,
      404,
      "HOMEWORK_PDF_NOT_FOUND",
    );
  }
}

/**
 * Download de PDF da geradora exige `learningProfileId` na query (Épico 6, BE-E6.3).
 */
export class LearningProfileIdRequiredError extends AppError {
  constructor() {
    super(
      "Informe o parâmetro learningProfileId para baixar o PDF de uma variante.",
      422,
      "LEARNING_PROFILE_ID_REQUIRED",
    );
  }
}

/**
 * Não há variante adaptada para o par geradora+perfil (Épico 6, BE-E6.3).
 */
export class HomeworkVariantNotFoundError extends AppError {
  constructor(homeworkId: string, learningProfileId: string) {
    super(
      `Nenhuma variante da homework "${homeworkId}" para o perfil "${learningProfileId}".`,
      404,
      "HOMEWORK_VARIANT_NOT_FOUND",
    );
  }
}
