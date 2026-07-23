import type { Homework } from "../../material/domain/homework.js";

/**
 * Índice de variantes adaptadas pelo `learningProfileId` (Épico 7, BE-E7.3).
 * A geradora (`learningProfileId === null`) fica de fora.
 */
export function indexVariantsByLearningProfileId(
  variants: Homework[],
): Map<string, Homework> {
  const byProfileId: Map<string, Homework> = new Map();

  for (const variant of variants) {
    if (variant.learningProfileId !== null) {
      byProfileId.set(variant.learningProfileId, variant);
    }
  }

  return byProfileId;
}

/**
 * Seleciona a variante cujo `learningProfileId` corresponde exatamente ao
 * único perfil ativo do aluno — sem prioridade entre perfis (Épico 7, BE-E7.3).
 */
export function resolveDeliveryVariantForProfile(
  learningProfileId: string,
  variantsByProfileId: Map<string, Homework>,
): Homework | undefined {
  return variantsByProfileId.get(learningProfileId);
}
