/**
 * Erro de aplicação base, com status HTTP e código de erro estável (para o
 * cliente identificar o caso sem depender do texto da mensagem).
 */
export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
  }
}
