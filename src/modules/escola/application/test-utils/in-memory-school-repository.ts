import type { School } from "../../domain/school.js";
import type { SchoolRepository } from "../../ports/school-repository.js";

/**
 * Fake de `SchoolRepository` em memória, usado apenas nos testes de
 * comportamento das camadas de application/domain (ver ADR 009: sem mocks
 * de infraestrutura pesados para testes de regra de negócio).
 */
export class InMemorySchoolRepository implements SchoolRepository {
  constructor(private schools: School[] = []) {}

  async findAll(): Promise<School[]> {
    return [...this.schools];
  }
}
