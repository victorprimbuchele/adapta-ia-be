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

  async findById(id: string): Promise<School | null> {
    return this.schools.find((school) => school.id === id) ?? null;
  }

  async findByName(name: string): Promise<School | null> {
    return this.schools.find((school) => school.name.toLowerCase() === name.toLowerCase()) ?? null;
  }

  async create(name: string, city: string, state: string): Promise<School> {
    const school: School = {
      id: `school-${this.schools.length + 1}`,
      name,
      city,
      state,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.schools.push(school);
    return school;
  }
}
