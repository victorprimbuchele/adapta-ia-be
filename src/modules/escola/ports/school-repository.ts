import type { School } from "../domain/school.js";

export interface SchoolRepository {
  findAll(): Promise<School[]>;
  findById(id: string): Promise<School | null>;
}
