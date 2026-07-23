import nodemailer from "nodemailer";

import { NodemailerEmailSender } from "./nodemailer-email-sender.js";

describe("NodemailerEmailSender (BE-E7.5)", () => {
  it("envia e-mail via transporter SMTP com anexo PDF", async () => {
    const sendMail = jest.fn().mockResolvedValue({ messageId: "msg-1" });
    const createTransport = jest.spyOn(nodemailer, "createTransport").mockReturnValue({
      sendMail,
    } as never);

    const sender = new NodemailerEmailSender({
      host: "smtp.gmail.com",
      port: 587,
      user: "teacher@gmail.com",
      pass: "app-password",
      from: "Adapta.ia <teacher@gmail.com>",
    });

    await sender.send({
      to: "aluno@escola.com",
      subject: "Nova atividade: Frações",
      html: "<p>Conteúdo</p>",
      attachments: [
        {
          filename: "fracoes.pdf",
          content: Buffer.from("%PDF"),
          contentType: "application/pdf",
        },
      ],
    });

    expect(createTransport).toHaveBeenCalledWith({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: { user: "teacher@gmail.com", pass: "app-password" },
    });
    expect(sendMail).toHaveBeenCalledWith({
      from: "Adapta.ia <teacher@gmail.com>",
      to: "aluno@escola.com",
      subject: "Nova atividade: Frações",
      html: "<p>Conteúdo</p>",
      attachments: [
        {
          filename: "fracoes.pdf",
          content: Buffer.from("%PDF"),
          contentType: "application/pdf",
        },
      ],
    });

    createTransport.mockRestore();
  });
});
