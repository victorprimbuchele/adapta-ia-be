import type { PrismaClient } from "../../../../generated/prisma/client.js";
import type { Grade } from "../../domain/grade.js";
import type { GradeRepository } from "../../ports/grade-repository.js";

export class PrismaGradeRepository implements GradeRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(): Promise<Grade[]> {
    return this.prisma.grade.findMany({ orderBy: { sortOrder: "asc" } });
  }
}
