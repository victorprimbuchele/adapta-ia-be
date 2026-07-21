import type { LearningProfile } from "../../domain/learning-profile.js";
import type { LearningProfileRepository } from "../../ports/learning-profile-repository.js";

/**
 * Fake de `LearningProfileRepository` em memória, usado apenas nos testes
 * de comportamento das camadas de application/domain (ver ADR 009).
 */
export class InMemoryLearningProfileRepository
  implements LearningProfileRepository
{
  readonly profiles: LearningProfile[];

  constructor(profiles: LearningProfile[] = []) {
    this.profiles = profiles;
  }

  async findAll(): Promise<LearningProfile[]> {
    return [...this.profiles].sort((a, b) => a.name.localeCompare(b.name));
  }

  async findById(id: string): Promise<LearningProfile | null> {
    return this.profiles.find((profile) => profile.id === id) ?? null;
  }
}
