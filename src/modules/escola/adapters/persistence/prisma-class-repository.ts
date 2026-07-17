import type { PrismaClient } from "../../../../generated/prisma/client.js";
import type { Class } from "../../domain/class.js";
import type {
  ClassRepository,
  CreateClassData,
} from "../../ports/class-repository.js";

export class PrismaClassRepository implements ClassRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateClassData): Promise<Class> {
    return this.prisma.class.create({ data });
  }

  async findByTeacherId(teacherId: string): Promise<Class[]> {
    return this.prisma.class.findMany({
      where: { teacherId, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(id: string): Promise<Class | null> {
    return this.prisma.class.findFirst({ where: { id, deletedAt: null } });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.class.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
