import type { LearningProfilePrompt } from "../../escola/domain/learning-profile-prompt.js";
import type { GlossaryEntry } from "../domain/glossary.js";

export interface GenerateVariantPdfInput {
  title: string;
  content: string;
  question?: string | null;
  glossary: GlossaryEntry[] | null;
  profilePrompt: LearningProfilePrompt;
}

export interface GeneratedPdf {
  data: Buffer;
  mimeType: "application/pdf";
}

/**
 * Porta de geração de PDF adaptado (Épico 6, BE-E6.2).
 */
export interface PdfGeneratorPort {
  generate(input: GenerateVariantPdfInput): Promise<GeneratedPdf>;
}
