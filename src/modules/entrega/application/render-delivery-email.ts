import type { GlossaryEntry } from "../../material/domain/glossary.js";

export interface RenderDeliveryEmailInput {
  studentName: string;
  homeworkTitle: string;
  variantContent: string;
  glossary: GlossaryEntry[] | null;
  /** Link público temporário para o áudio TTS, quando disponível (BE-E7.5). */
  audioUrl?: string | null;
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
 * Monta o e-mail de entrega da atividade adaptada (Épico 7, BE-E7.5).
 * O conteúdo adaptado vai inline; o PDF é anexado e o áudio TTS, quando
 * existir, é linkado via URL pública assinada.
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

  const audioHtml = input.audioUrl
    ? `
      <p style="margin-top:16px;">
        <a href="${escapeHtml(input.audioUrl)}" style="color:#2F7A5B;font-weight:bold;">
          Ouça a versão em áudio da atividade
        </a>
      </p>`
    : "";

  const html = `
    <div style="font-family:Arial,sans-serif;color:#1A2D27;max-width:600px;margin:0 auto;">
      <p>Olá, ${escapeHtml(input.studentName)}!</p>
      <p>Seu(sua) professor(a) enviou uma nova atividade adaptada para você: <strong>${escapeHtml(input.homeworkTitle)}</strong>.</p>
      <p style="color:#6B8279;font-size:13px;">O PDF da atividade está anexado a este e-mail.</p>
      <div style="background:#F4F8F6;border-radius:12px;padding:16px;white-space:pre-wrap;line-height:1.6;">
        ${escapeHtml(input.variantContent)}
      </div>
      ${glossaryHtml}
      ${audioHtml}
      <p style="color:#6B8279;font-size:12px;margin-top:24px;">Adapta.ia — atividades adaptadas para cada perfil de aprendizagem.</p>
    </div>
  `.trim();

  return { subject, html };
}
