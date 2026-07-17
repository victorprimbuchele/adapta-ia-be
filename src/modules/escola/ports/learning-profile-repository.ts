import type { LearningProfile } from "../domain/learning-profile.js";

/**
 * Persistência do catálogo de `LearningProfile` (ver Épico 3, BE-E3.2).
 */
export interface LearningProfileRepository {
  findById(id: string): Promise<LearningProfile | null>;
}
