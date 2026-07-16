import type { Grade } from "../../domain/grade.js";
import type { GradeRepository } from "../../ports/grade-repository.js";

/**
 * Fake de `GradeRepository` em memória, usado apenas nos testes de
 * comportamento das camadas de application/domain (ver ADR 009: sem mocks
 * de infraestrutura pesados para testes de regra de negócio).
 */
export class InMemoryGradeRepository implements GradeRepository {
  constructor(private grades: Grade[] = []) {}

  async findAll(): Promise<Grade[]> {
    return [...this.grades];
  }
}
