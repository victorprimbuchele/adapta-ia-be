import type { Homework } from "./homework.js";

/**
 * Homework geradora: sem vínculo a outra homework (`homeworkId` null).
 */
export function isGeneratorHomework(homework: Homework): boolean {
  return homework.homeworkId === null;
}

/**
 * Regra BE-E4.7: a atividade geradora nunca tem `learningProfileId`
 * preenchido. Perfil só existe nas variantes adaptadas.
 */
export function generatorHasNoLearningProfile(homework: Homework): boolean {
  return isGeneratorHomework(homework) && homework.learningProfileId === null;
}
