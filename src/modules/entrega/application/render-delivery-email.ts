import type { GlossaryEntry } from "../../material/domain/glossary.js";

export interface RenderDeliveryEmailInput {
  studentName: string;
  homeworkTitle: string;
  variantContent: string;
  glossary: GlossaryEntry[] | null;
}

export interface RenderedEmail {
  subject: string;
  html: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Monta o e-mail de entrega da atividade adaptada (Épico 6, BE-E6.2).
 * Sem PDF anexo no MVP (lacuna conhecida — ver docs/API.md §9.4): o
 * conteúdo adaptado vai inline no corpo do e-mail.
 */
export function renderDeliveryEmail(input: RenderDeliveryEmailInput): RenderedEmail {
  const subject = `Nova atividade: ${input.homeworkTitle}`;

  const glossaryHtml =
    input.glossary && input.glossary.length > 0
      ? `
        <h2 style="font-size:14px;color:#1A2D27;">Glossário</h2>
        <ul style="padding-left:20px;">
          ${input.glossary
            .map(
              (entry) =>
                `<li><strong>${escapeHtml(entry.term)}:</strong> ${escapeHtml(entry.definition)}</li>`,
            )
            .join("")}
        </ul>`
      : "";

  const html = `
    <div style="font-family:Arial,sans-serif;color:#1A2D27;max-width:600px;margin:0 auto;">
      <p>Olá, ${escapeHtml(input.studentName)}!</p>
      <p>Seu(sua) professor(a) enviou uma nova atividade adaptada para você: <strong>${escapeHtml(input.homeworkTitle)}</strong>.</p>
      <div style="background:#F4F8F6;border-radius:12px;padding:16px;white-space:pre-wrap;line-height:1.6;">
        ${escapeHtml(input.variantContent)}
      </div>
      ${glossaryHtml}
      <p style="color:#6B8279;font-size:12px;margin-top:24px;">Adapta.ia — atividades adaptadas para cada perfil de aprendizagem.</p>
    </div>
  `.trim();

  return { subject, html };
}
