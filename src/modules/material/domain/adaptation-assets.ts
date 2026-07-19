import type { Homework } from "./homework.js";
import { isGeneratorHomework } from "./generator-homework.js";

export { isGeneratorHomework } from "./generator-homework.js";

/**
 * Glossário estruturado e/ou áudio TTS — assets de adaptação (Épico 5).
 */
export function hasAdaptationAssets(homework: Homework): boolean {
  return homework.glossary !== null || homework.audioFileId !== null;
}

/**
 * Regra BE-E5.11: glossário e áudio só existem em variantes.
 * A geradora nunca carrega esses campos preenchidos.
 */
export function generatorHasNoAdaptationAssets(homework: Homework): boolean {
  return isGeneratorHomework(homework) && !hasAdaptationAssets(homework);
}
