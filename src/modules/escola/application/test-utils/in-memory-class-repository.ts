import type { Class } from "../../domain/class.js";
import type {
  ClassRepository,
  CreateClassData,
} from "../../ports/class-repository.js";

let nextId = 1;

/**
 * Fake de `ClassRepository` em memória, usado apenas nos testes de
 * comportamento das camadas de application/domain (ver ADR 009: sem mocks
 * de infraestrutura pesados para testes de regra de negócio).
 */
export class InMemoryClassRepository implements ClassRepository {
  readonly classes: Class[] = [];

  async create(data: CreateClassData): Promise<Class> {
    const now = new Date();
    const createdClass: Class = {
      id: `class-${nextId++}`,
      name: data.name,
      schoolId: data.schoolId,
      gradeId: data.gradeId,
      teacherId: data.teacherId,
      createdAt: now,
      updatedAt: now,
    };

    this.classes.push(createdClass);
    return createdClass;
  }

  async findByTeacherId(teacherId: string): Promise<Class[]> {
    return this.classes.filter((klass) => klass.teacherId === teacherId);
  }

  async findById(id: string): Promise<Class | null> {
    return this.classes.find((klass) => klass.id === id) ?? null;
  }
}
