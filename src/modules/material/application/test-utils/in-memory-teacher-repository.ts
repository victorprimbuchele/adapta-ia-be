import type { Teacher } from "../../domain/teacher.js";
import type { TeacherRepository } from "../../ports/teacher-repository.js";

/**
 * Fake de `TeacherRepository` em memória para testes de comportamento.
 */
export class InMemoryTeacherRepository implements TeacherRepository {
  constructor(private readonly teachers: Teacher[] = []) {}

  async findById(id: string): Promise<Teacher | null> {
    return this.teachers.find((teacher) => teacher.id === id) ?? null;
  }
}
