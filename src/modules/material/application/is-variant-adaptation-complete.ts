import type { LearningProfilePrompt } from "../../escola/domain/learning-profile-prompt.js";
import type { Homework } from "../domain/homework.js";

/**
 * Variante pronta para o perfil: texto persistido e, quando o perfil pede,
 * glossário e áudio TTS presentes (BE-E5.9 — não marcar incompleta como pronta).
 */
export function isVariantAdaptationComplete(
  variant: Homework,
  profilePrompt: LearningProfilePrompt,
): boolean {
  if (!variant.title.trim() || !variant.content.trim()) {
    return false;
  }

  if (profilePrompt.adaptations.glossary && variant.glossary === null) {
    return false;
  }

  if (profilePrompt.adaptations.tts && variant.audioFileId === null) {
    return false;
  }

  return true;
}
