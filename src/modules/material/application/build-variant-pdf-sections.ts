import type { LearningProfilePrompt } from "../../escola/domain/learning-profile-prompt.js";
import type { GlossaryEntry } from "../domain/glossary.js";
import {
  resolvePdfTemplateTheme,
  type PdfTemplateTheme,
} from "../domain/pdf-template-theme.js";

export interface VariantPdfSections {
  theme: PdfTemplateTheme;
  title: string;
  contentBlocks: string[];
  question: string | null;
  glossaryEntries: GlossaryEntry[];
}

export function buildVariantPdfContentBlocks(
  content: string,
  profilePrompt: LearningProfilePrompt,
): string[] {
  const theme = resolvePdfTemplateTheme(profilePrompt);
  const trimmed = content.trim();

  if (theme.layout !== "structured") {
    return [trimmed];
  }

  const paragraphs = trimmed
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  if (paragraphs.length > 1) {
    return paragraphs;
  }

  return trimmed
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

/**
 * Monta as seções textuais do PDF adaptado (Épico 6, BE-E6.4).
 * Usado pelo adapter pdfkit e pelos testes de conteúdo/formatação.
 */
export function buildVariantPdfSections(input: {
  title: string;
  content: string;
  question?: string | null;
  glossary: GlossaryEntry[] | null;
  profilePrompt: LearningProfilePrompt;
}): VariantPdfSections {
  const theme = resolvePdfTemplateTheme(input.profilePrompt);

  return {
    theme,
    title: input.title.trim(),
    contentBlocks: buildVariantPdfContentBlocks(
      input.content,
      input.profilePrompt,
    ),
    question: input.question?.trim() ? input.question.trim() : null,
    glossaryEntries:
      theme.showGlossary && input.glossary && input.glossary.length > 0
        ? input.glossary
        : [],
  };
}

export function formatGlossaryLine(entry: GlossaryEntry): string {
  return `${entry.term}: ${entry.definition}`;
}
