import type { LearningProfile } from "../domain/learning-profile.js";
import type { LearningProfileRepository } from "../ports/learning-profile-repository.js";

/**
 * Lista o catálogo de perfis de aprendizagem (dado de referência fixo,
 * populado via seed) para popular o formulário de vínculo de perfil do
 * aluno no frontend (ver docs/API.md §9.1 — lacuna conhecida corrigida).
 */
export class ListLearningProfiles {
  constructor(private readonly learningProfileRepository: LearningProfileRepository) {}

  async execute(): Promise<LearningProfile[]> {
    return this.learningProfileRepository.findAll();
  }
}
