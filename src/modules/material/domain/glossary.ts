import { z } from "zod";

/**
 * Entrada do glossário estruturado gerado a partir do conteúdo
 * simplificado (Épico 5, BE-E5.4).
 */
export interface GlossaryEntry {
  term: string;
  definition: string;
}

export const glossaryEntrySchema = z.object({
  term: z.string().trim().min(1),
  definition: z.string().trim().min(1),
});

export const glossarySchema = z.array(glossaryEntrySchema);

export function parseGlossary(value: unknown): GlossaryEntry[] {
  return glossarySchema.parse(value);
}
