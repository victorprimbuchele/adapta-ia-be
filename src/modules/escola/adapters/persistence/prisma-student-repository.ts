import { randomBytes } from "node:crypto";

import bcrypt from "bcrypt";

import type { PrismaClient } from "../../../../generated/prisma/client.js";
import type { Student } from "../../domain/student.js";
import type {
  CreateStudentData,
  StudentRepository,
} from "../../ports/student-repository.js";

const SALT_ROUNDS = 10;

/**
 * Implementação de `StudentRepository` sobre a tabela `users` (o aluno é,
 * do ponto de vista do domínio de autenticação, um `User` — ver módulo
 * `usuario`). Seleciona apenas `id`/`name`/`email`, que é o que o módulo
 * `escola` precisa para vinculação e exibição (ver Épico 3, BE-E3.1).
 *
 * Alunos cadastrados pelo professor ainda não fazem login no MVP: a senha
 * é gerada aleatoriamente e hasheada no adapter para satisfazer o
 * `password_hash` obrigatório de `users`, sem expor senha ao domínio.
 */
export class PrismaStudentRepository implements StudentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Student | null> {
    return this.prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true },
    });
  }

  async findByIds(ids: string[]): Promise<Student[]> {
    if (ids.length === 0) {
      return [];
    }

    return this.prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true, email: true },
    });
  }

  async findByEmail(email: string): Promise<Student | null> {
    return this.prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true },
    });
  }

  async create(data: CreateStudentData): Promise<Student> {
    const passwordHash = await bcrypt.hash(
      randomBytes(32).toString("hex"),
      SALT_ROUNDS,
    );

    return this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
      },
      select: { id: true, name: true, email: true },
    });
  }
}
