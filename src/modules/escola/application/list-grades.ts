import type { Grade } from "../domain/grade.js";
import type { GradeRepository } from "../ports/grade-repository.js";

/**
 * Lista as séries disponíveis (dado de referência fixo, populado via seed)
 * para popular o formulário de criação de turma.
 */
export class ListGrades {
  constructor(private readonly gradeRepository: GradeRepository) {}

  async execute(): Promise<Grade[]> {
    return this.gradeRepository.findAll();
  }
}
