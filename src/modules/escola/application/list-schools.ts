import type { School } from "../domain/school.js";
import type { SchoolRepository } from "../ports/school-repository.js";

/**
 * Lista as escolas disponíveis (dado de referência fixo, populado via seed)
 * para popular o formulário de criação de turma.
 */
export class ListSchools {
  constructor(private readonly schoolRepository: SchoolRepository) {}

  async execute(): Promise<School[]> {
    return this.schoolRepository.findAll();
  }
}
