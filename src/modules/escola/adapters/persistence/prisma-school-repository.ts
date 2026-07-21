import type { PrismaClient } from "../../../../generated/prisma/client.js";
import type { School } from "../../domain/school.js";
import type { SchoolRepository } from "../../ports/school-repository.js";

export class PrismaSchoolRepository implements SchoolRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(): Promise<School[]> {
    return this.prisma.school.findMany({ orderBy: { name: "asc" } });
  }

  async findById(id: string): Promise<School | null> {
    return this.prisma.school.findUnique({ where: { id } });
  }

  async findByName(name: string): Promise<School | null> {
    return this.prisma.school.findFirst({
      where: {
        name: {
          equals: name,
          mode: "insensitive",
        },
      },
    });
  }

  async create(name: string, city: string, state: string): Promise<School> {
    return this.prisma.school.create({
      data: {
        name,
        city,
        state,
      },
    });
  }
}
