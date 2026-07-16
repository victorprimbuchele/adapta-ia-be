import bcrypt from "bcrypt";

import { EmailAlreadyInUseError } from "../domain/errors.js";
import type { User } from "../domain/user.js";
import type { CreateUserData, UserRepository } from "../ports/user-repository.js";
import { RegisterUser } from "./register-user.js";

class InMemoryUserRepository implements UserRepository {
  private users: User[] = [];

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

describe("RegisterUser", () => {
  it("persiste a senha apenas como hash bcrypt, nunca em texto puro", async () => {
    const repository = new InMemoryUserRepository();
    const registerUser = new RegisterUser(repository);
    const plainPassword = "senha-super-secreta";

    const user = await registerUser.execute({
      name: "Marta Silva",
      email: "marta@escola.com",
      password: plainPassword,
    });

    expect(user.passwordHash).not.toBe(plainPassword);
    expect(user.passwordHash).not.toContain(plainPassword);
    expect(user.passwordHash).toMatch(/^\$2[aby]\$\d{2}\$/);

    const isValidHash = await bcrypt.compare(plainPassword, user.passwordHash);
    expect(isValidHash).toBe(true);
  });

  it("gera hashes diferentes para a mesma senha em cadastros distintos (salt único)", async () => {
    const repository = new InMemoryUserRepository();
    const registerUser = new RegisterUser(repository);
    const plainPassword = "senha-super-secreta";

    const userA = await registerUser.execute({
      name: "Marta Silva",
      email: "marta@escola.com",
      password: plainPassword,
    });
    const userB = await registerUser.execute({
      name: "João Souza",
      email: "joao@escola.com",
      password: plainPassword,
    });

    expect(userA.passwordHash).not.toBe(userB.passwordHash);
  });

  it("rejeita cadastro com e-mail já em uso", async () => {
    const repository = new InMemoryUserRepository();
    const registerUser = new RegisterUser(repository);

    await registerUser.execute({
      name: "Marta Silva",
      email: "marta@escola.com",
      password: "senha-super-secreta",
    });

    await expect(
      registerUser.execute({
        name: "Marta Silva",
        email: "marta@escola.com",
        password: "outra-senha-123",
      }),
    ).rejects.toBeInstanceOf(EmailAlreadyInUseError);
  });
});
