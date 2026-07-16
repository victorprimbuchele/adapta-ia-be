import type { PrismaClient } from "../../../../generated/prisma/client.js";
import type { School } from "../../domain/school.js";
import type { SchoolRepository } from "../../ports/school-repository.js";

export class PrismaSchoolRepository implements SchoolRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(): Promise<School[]> {
    return this.prisma.school.findMany({ orderBy: { name: "asc" } });
  }
}
