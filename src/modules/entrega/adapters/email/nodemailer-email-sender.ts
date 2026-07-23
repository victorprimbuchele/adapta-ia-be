import nodemailer, { type Transporter } from "nodemailer";

import type { EmailSenderPort, SendEmailInput } from "../../ports/email-sender.js";

/**
 * Adapter Gmail SMTP via nodemailer para `EmailSenderPort` (Épico 7, BE-E7.5).
 * Env: `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`, `SMTP_USER`, `SMTP_PASS`,
 * `SMTP_FROM`.
 */
export class NodemailerEmailSender implements EmailSenderPort {
  private readonly transporter: Transporter;
  private readonly from: string;

  constructor(options?: {
    host?: string;
    port?: number;
    user?: string;
    pass?: string;
    from?: string;
  }) {
    const host = options?.host ?? process.env["SMTP_HOST"];
    const port = options?.port ?? Number(process.env["SMTP_PORT"] ?? 587);
    const user = options?.user ?? process.env["SMTP_USER"];
    const pass = options?.pass ?? process.env["SMTP_PASS"];
    const from = options?.from ?? process.env["SMTP_FROM"];

    if (!host || !user || !pass || !from) {
      throw new Error("SMTP_HOST, SMTP_USER, SMTP_PASS and SMTP_FROM are required.");
    }

    this.from = from;
    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  async send(input: SendEmailInput): Promise<void> {
    await this.transporter.sendMail({
      from: this.from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      attachments: input.attachments?.map((attachment) => ({
        filename: attachment.filename,
        content: attachment.content,
        contentType: attachment.contentType,
      })),
    });
  }
}
