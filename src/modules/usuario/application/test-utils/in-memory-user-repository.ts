import type { User } from "../../domain/user.js";
import type { CreateUserData, UserRepository } from "../../ports/user-repository.js";

/**
 * Fake de `UserRepository` em memória, usado apenas nos testes de
 * comportamento das camadas de application/domain (ver ADR 009: sem mocks
 * de infraestrutura pesados para testes de regra de negócio).
 */
export class InMemoryUserRepository implements UserRepository {
  private users: User[] = [];

  async findById(id: string): Promise<User | null> {
    return this.users.find((user) => user.id === id) ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.users.find((user) => user.email === email) ?? null;
  }

  async create(data: CreateUserData): Promise<User> {
    const user: User = {
      id: `user-${this.users.length + 1}`,
      name: data.name,
      email: data.email,
      passwordHash: data.passwordHash,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.push(user);
    return user;
  }

  async updateLastLoginAt(userId: string, date: Date): Promise<User> {
    const user = this.users.find((candidate) => candidate.id === userId);
    if (!user) {
      throw new Error(`Usuário "${userId}" não encontrado.`);
    }
    user.lastLoginAt = date;
    return user;
  }
}
