export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

/**
 * Porta de envio de e-mail (Épico 6, BE-E6.2). Adapter MVP usa SMTP via
 * nodemailer; trocar por outro provedor = trocar o adapter.
 */
export interface EmailSenderPort {
  send(input: SendEmailInput): Promise<void>;
}
