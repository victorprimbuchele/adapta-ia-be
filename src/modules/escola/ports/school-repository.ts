import type { School } from "../domain/school.js";

export interface SchoolRepository {
  findAll(): Promise<School[]>;
  findById(id: string): Promise<School | null>;
  findByName(name: string): Promise<School | null>;
  create(name: string, city: string, state: string): Promise<School>;
}

