import type { Teacher } from "../../domain/teacher.js";
import type { TeacherRepository } from "../../ports/teacher-repository.js";

/**
 * Fake de `TeacherRepository` em memória, usado apenas nos testes de
 * comportamento das camadas de application/domain (ver ADR 009: sem mocks
 * de infraestrutura pesados para testes de regra de negócio).
 */
export class InMemoryTeacherRepository implements TeacherRepository {
  constructor(private teachers: Teacher[] = []) {}

  async findById(id: string): Promise<Teacher | null> {
    return this.teachers.find((teacher) => teacher.id === id) ?? null;
  }
}
