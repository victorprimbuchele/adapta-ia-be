import type { PrismaClient } from "../../../../generated/prisma/client.js";
import type { Teacher } from "../../domain/teacher.js";
import type { TeacherRepository } from "../../ports/teacher-repository.js";

/**
 * Implementação de `TeacherRepository` sobre a tabela `users` (o professor
 * é, do ponto de vista do domínio de autenticação, um `User` — ver módulo
 * `usuario`). Seleciona apenas `id`, já que o módulo `escola` só precisa
 * confirmar a existência do professor (ver Épico 2, BE-E2.8).
 */
export class PrismaTeacherRepository implements TeacherRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Teacher | null> {
    return this.prisma.user.findUnique({ where: { id }, select: { id: true } });
  }
}
