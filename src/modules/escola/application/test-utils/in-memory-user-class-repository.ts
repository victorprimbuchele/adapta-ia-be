import type { UserClassRepository } from "../../ports/user-class-repository.js";

interface UserClassLink {
  classId: string;
  studentId: string;
}

/**
 * Fake de `UserClassRepository` em memória, usado apenas nos testes de
 * comportamento das camadas de application/domain (ver ADR 009: sem mocks
 * de infraestrutura pesados para testes de regra de negócio).
 */
export class InMemoryUserClassRepository implements UserClassRepository {
  readonly links: UserClassLink[] = [];

  async exists(classId: string, studentId: string): Promise<boolean> {
    return this.links.some(
      (link) => link.classId === classId && link.studentId === studentId,
    );
  }

  async create(classId: string, studentId: string): Promise<void> {
    this.links.push({ classId, studentId });
  }
}
