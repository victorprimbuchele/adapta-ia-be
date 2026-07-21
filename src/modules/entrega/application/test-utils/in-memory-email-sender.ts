import type { EmailSenderPort, SendEmailInput } from "../../ports/email-sender.js";

/**
 * Fake de `EmailSenderPort` em memória (ADR 009 / Épico 6, BE-E6.2).
 */
export class InMemoryEmailSender implements EmailSenderPort {
  readonly sent: SendEmailInput[] = [];
  private failNextWith: Error | null = null;

  async send(input: SendEmailInput): Promise<void> {
    if (this.failNextWith) {
      const error = this.failNextWith;
      this.failNextWith = null;
      throw error;
    }
    this.sent.push(input);
  }

  failNext(error: Error): void {
    this.failNextWith = error;
  }
}
