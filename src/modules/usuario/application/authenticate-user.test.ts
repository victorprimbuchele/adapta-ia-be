import bcrypt from "bcrypt";

import { InvalidCredentialsError } from "../domain/errors.js";
import type { User } from "../domain/user.js";
import type { CreateUserData, UserRepository } from "../ports/user-repository.js";
import { AuthenticateUser } from "./authenticate-user.js";

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
}

async function seedUser(
  repository: UserRepository,
  email: string,
  plainPassword: string,
): Promise<void> {
  const passwordHash = await bcrypt.hash(plainPassword, 10);
  await repository.create({ name: "Marta Silva", email, passwordHash });
}

describe("AuthenticateUser", () => {
  it("retorna o usuário quando e-mail e senha estão corretos", async () => {
    const repository = new InMemoryUserRepository();
    await seedUser(repository, "marta@escola.com", "senha-correta-123");
    const authenticateUser = new AuthenticateUser(repository);

    const user = await authenticateUser.execute({
      email: "marta@escola.com",
      password: "senha-correta-123",
    });

    expect(user.email).toBe("marta@escola.com");
  });

  it("rejeita com erro genérico quando a senha está incorreta", async () => {
    const repository = new InMemoryUserRepository();
    await seedUser(repository, "marta@escola.com", "senha-correta-123");
    const authenticateUser = new AuthenticateUser(repository);

    await expect(
      authenticateUser.execute({
        email: "marta@escola.com",
        password: "senha-errada",
      }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it("rejeita com o mesmo erro genérico quando o e-mail não existe", async () => {
    const repository = new InMemoryUserRepository();
    const authenticateUser = new AuthenticateUser(repository);

    await expect(
      authenticateUser.execute({
        email: "inexistente@escola.com",
        password: "qualquer-senha",
      }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it("usa a mesma mensagem/código de erro para e-mail inexistente e senha incorreta", async () => {
    const repository = new InMemoryUserRepository();
    await seedUser(repository, "marta@escola.com", "senha-correta-123");
    const authenticateUser = new AuthenticateUser(repository);

    let errorForWrongPassword: unknown;
    let errorForUnknownEmail: unknown;

    try {
      await authenticateUser.execute({
        email: "marta@escola.com",
        password: "senha-errada",
      });
    } catch (error) {
      errorForWrongPassword = error;
    }

    try {
      await authenticateUser.execute({
        email: "inexistente@escola.com",
        password: "senha-errada",
      });
    } catch (error) {
      errorForUnknownEmail = error;
    }

    expect((errorForWrongPassword as InvalidCredentialsError).message).toBe(
      (errorForUnknownEmail as InvalidCredentialsError).message,
    );
    expect((errorForWrongPassword as InvalidCredentialsError).code).toBe(
      (errorForUnknownEmail as InvalidCredentialsError).code,
    );
  });
});
