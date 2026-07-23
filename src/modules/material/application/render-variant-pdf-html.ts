import type { LearningProfilePrompt } from "../../escola/domain/learning-profile-prompt.js";
import type { GlossaryEntry } from "../domain/glossary.js";
import {
  resolvePdfTemplateTheme,
  type PdfTemplateTheme,
} from "../domain/pdf-template-theme.js";

export interface RenderVariantPdfHtmlInput {
  title: string;
  content: string;
  question?: string | null;
  glossary: GlossaryEntry[] | null;
  profilePrompt: LearningProfilePrompt;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildThemeStyles(theme: PdfTemplateTheme): string {
  const isHighContrast = theme.palette === "high-contrast";
  const isLarge = theme.typography === "large";
  const isStructured = theme.layout === "structured";

  const colors = isHighContrast
    ? {
        pageBg: "#000000",
        text: "#FFFFFF",
        heading: "#FFFF00",
        accent: "#FFFF00",
        panelBg: "#1A1A1A",
        panelBorder: "#FFFF00",
        glossaryBg: "#111111",
      }
    : {
        pageBg: "#FFFFFF",
        text: "#1A2D27",
        heading: "#1A2D27",
        accent: "#2E7D6B",
        panelBg: "#F4F8F6",
        panelBorder: "#C5DDD4",
        glossaryBg: "#EEF5F1",
      };

  const baseFontSize = isLarge ? "22px" : isStructured ? "15px" : "16px";
  const headingSize = isLarge ? "28px" : isStructured ? "20px" : "22px";
  const lineHeight = isLarge ? "1.8" : "1.6";

  return `
    @page { margin: 24mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 32px;
      background: ${colors.pageBg};
      color: ${colors.text};
      font-family: ${isHighContrast ? "Arial, Helvetica, sans-serif" : "Georgia, 'Times New Roman', serif"};
      font-size: ${baseFontSize};
      line-height: ${lineHeight};
    }
    main {
      max-width: 720px;
      margin: 0 auto;
    }
    h1 {
      margin: 0 0 24px;
      font-size: ${headingSize};
      line-height: 1.25;
      color: ${colors.heading};
      ${theme.screenReaderOptimized ? "border-bottom: 3px solid " + colors.accent + ";" : ""}
      padding-bottom: ${theme.screenReaderOptimized ? "12px" : "0"};
    }
    .content-panel {
      background: ${colors.panelBg};
      border: 2px solid ${colors.panelBorder};
      border-radius: ${isStructured ? "8px" : "12px"};
      padding: ${isLarge ? "28px" : "20px"};
      white-space: pre-wrap;
      ${isStructured ? "counter-reset: step;" : ""}
    }
    .content-panel.structured p {
      margin: 0 0 16px;
      padding-left: ${isStructured ? "48px" : "0"};
      position: relative;
    }
    .content-panel.structured p:last-child {
      margin-bottom: 0;
    }
    .content-panel.structured p::before {
      counter-increment: step;
      content: counter(step);
      position: absolute;
      left: 0;
      top: 0;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: ${colors.accent};
      color: ${isHighContrast ? "#000000" : "#FFFFFF"};
      font-weight: bold;
      font-size: ${isLarge ? "18px" : "14px"};
      line-height: 32px;
      text-align: center;
    }
    .question-block {
      margin-top: 24px;
      padding: ${isLarge ? "20px" : "16px"};
      border-left: 4px solid ${colors.accent};
      background: ${colors.glossaryBg};
    }
    .question-block h2 {
      margin: 0 0 8px;
      font-size: ${isLarge ? "20px" : "16px"};
      color: ${colors.heading};
    }
    .glossary {
      margin-top: 32px;
      padding: ${isLarge ? "24px" : "20px"};
      background: ${colors.glossaryBg};
      border: 2px solid ${colors.panelBorder};
      border-radius: 8px;
    }
    .glossary h2 {
      margin: 0 0 16px;
      font-size: ${isLarge ? "22px" : "18px"};
      color: ${colors.heading};
    }
    .glossary dl {
      margin: 0;
    }
    .glossary dt {
      font-weight: bold;
      margin-top: 12px;
      color: ${colors.heading};
    }
    .glossary dt:first-child {
      margin-top: 0;
    }
    .glossary dd {
      margin: 4px 0 0;
    }
    footer {
      margin-top: 32px;
      font-size: ${isLarge ? "14px" : "12px"};
      color: ${isHighContrast ? "#CCCCCC" : "#6B8279"};
      text-align: center;
    }
  `.trim();
}

function renderContentParagraphs(content: string, theme: PdfTemplateTheme): string {
  const escaped = escapeHtml(content.trim());

  if (theme.layout !== "structured") {
    return escaped;
  }

  const paragraphs = escaped
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  if (paragraphs.length <= 1) {
    const lines = escaped.split(/\n/).map((line) => line.trim()).filter(Boolean);
    if (lines.length <= 1) {
      return `<p>${escaped}</p>`;
    }
    return lines.map((line) => `<p>${line}</p>`).join("\n");
  }

  return paragraphs.map((block) => `<p>${block.replace(/\n/g, "<br />")}</p>`).join("\n");
}

function renderGlossary(glossary: GlossaryEntry[], theme: PdfTemplateTheme): string {
  if (!theme.showGlossary || !glossary || glossary.length === 0) {
    return "";
  }

  const entries = glossary
    .map(
      (entry) =>
        `<dt>${escapeHtml(entry.term)}</dt><dd>${escapeHtml(entry.definition)}</dd>`,
    )
    .join("\n");

  const aria = theme.screenReaderOptimized ? ' aria-labelledby="glossary-heading"' : "";

  return `
    <section class="glossary"${aria}>
      <h2 id="glossary-heading">Glossário</h2>
      <dl>${entries}</dl>
    </section>
  `.trim();
}

function renderQuestion(question: string | null | undefined, theme: PdfTemplateTheme): string {
  if (!question?.trim()) {
    return "";
  }

  return `
    <section class="question-block" aria-labelledby="question-heading">
      <h2 id="question-heading">Questão</h2>
      <p>${escapeHtml(question.trim())}</p>
    </section>
  `.trim();
}

/**
 * Renderiza o HTML do PDF adaptado conforme o perfil de aprendizagem
 * (Épico 6, BE-E6.1). Cada combinação de flags produz um template visual
 * distinto (ex.: alto contraste + fonte grande para P3).
 */
export function renderVariantPdfHtml(input: RenderVariantPdfHtmlInput): string {
  const theme = resolvePdfTemplateTheme(input.profilePrompt);
  const contentClass =
    theme.layout === "structured" ? "content-panel structured" : "content-panel";

  const mainRole = theme.screenReaderOptimized ? ' role="main"' : "";
  const articleLabel = theme.screenReaderOptimized
    ? ` aria-label="Atividade adaptada: ${escapeHtml(input.title.trim())}"`
    : "";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(input.title.trim())}</title>
  <style data-template="${escapeHtml(theme.code)}">
${buildThemeStyles(theme)}
  </style>
</head>
<body data-pdf-template="${escapeHtml(theme.code)}" data-pdf-palette="${theme.palette}">
  <main${mainRole}>
    <article${articleLabel}>
      <h1>${escapeHtml(input.title.trim())}</h1>
      <section class="${contentClass}" aria-label="Conteúdo da atividade">
        ${renderContentParagraphs(input.content, theme)}
      </section>
      ${renderQuestion(input.question, theme)}
      ${renderGlossary(input.glossary, theme)}
    </article>
    <footer>Adapta.ia — material adaptado ao perfil ${escapeHtml(theme.code)}</footer>
  </main>
</body>
</html>`;
}
