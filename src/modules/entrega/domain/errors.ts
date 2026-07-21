import { AppError } from "../../../shared/errors/app-error.js";

/**
 * Envio informado não existe (Épico 6, BE-E6.1).
 */
export class DeliveryNotFoundError extends AppError {
  constructor(deliveryId: string) {
    super(`Envio "${deliveryId}" não encontrado.`, 404, "DELIVERY_NOT_FOUND");
  }
}

/**
 * Envio existe, mas não pertence ao professor autenticado.
 */
export class DeliveryAccessDeniedError extends AppError {
  constructor() {
    super("Você não tem permissão para acessar este envio.", 403, "DELIVERY_ACCESS_DENIED");
  }
}

/**
 * Turma da homework não tem nenhum aluno com perfil de aprendizagem
 * vinculado — não há para quem enviar (Épico 6, BE-E6.1).
 */
export class NoRecipientsToDeliverError extends AppError {
  constructor(homeworkId: string) {
    super(
      `Nenhum aluno com perfil de aprendizagem vinculado na turma da homework "${homeworkId}".`,
      422,
      "NO_RECIPIENTS_TO_DELIVER",
    );
  }
}

/**
 * Falha ao enviar o e-mail via SMTP (Épico 6, BE-E6.2). Retriável por
 * padrão — falhas de validação local (ex.: destinatário sem e-mail) usam
 * `retriable: false`.
 */
export class EmailDeliveryError extends AppError {
  readonly retriable: boolean;

  constructor(message: string, options?: { retriable?: boolean }) {
    super(message, 502, "EMAIL_DELIVERY_FAILED");
    this.retriable = options?.retriable ?? true;
  }
}
