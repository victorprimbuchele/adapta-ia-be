import type { PrismaClient } from "../../../../generated/prisma/client.js";
import type { User } from "../../domain/user.js";
import type { CreateUserData, UserRepository } from "../../ports/user-repository.js";

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async create(data: CreateUserData): Promise<User> {
    return this.prisma.user.create({ data });
  }

  async updateLastLoginAt(userId: string, date: Date): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: date },
    });
  }
}
