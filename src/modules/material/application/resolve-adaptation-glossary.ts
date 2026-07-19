import type { LearningProfilePrompt } from "../../escola/domain/learning-profile-prompt.js";
import type { GlossaryEntry } from "../domain/glossary.js";

/**
 * Decide o glossário a persistir na variante (BE-E5.4):
 * - perfil com `adaptations.glossary` → array estruturado (mesmo vazio);
 * - caso contrário → `null`.
 */
export function resolveAdaptationGlossary(
  profilePrompt: LearningProfilePrompt,
  glossaryFromLlm: GlossaryEntry[] | undefined,
): GlossaryEntry[] | null {
  if (!profilePrompt.adaptations.glossary) {
    return null;
  }

  return glossaryFromLlm ?? [];
}
