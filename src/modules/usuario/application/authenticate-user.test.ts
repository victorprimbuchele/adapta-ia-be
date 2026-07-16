import bcrypt from "bcrypt";

import { InvalidCredentialsError } from "../domain/errors.js";
import type { UserRepository } from "../ports/user-repository.js";
import { AuthenticateUser } from "./authenticate-user.js";
import { InMemoryUserRepository } from "./test-utils/in-memory-user-repository.js";

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

  it("atualiza lastLoginAt a cada login bem-sucedido", async () => {
    const repository = new InMemoryUserRepository();
    await seedUser(repository, "marta@escola.com", "senha-correta-123");
    const authenticateUser = new AuthenticateUser(repository);

    const userBeforeLogin = await repository.findByEmail("marta@escola.com");
    expect(userBeforeLogin?.lastLoginAt).toBeNull();

    const beforeLogin = new Date();
    const user = await authenticateUser.execute({
      email: "marta@escola.com",
      password: "senha-correta-123",
    });
    const afterLogin = new Date();

    expect(user.lastLoginAt).not.toBeNull();
    expect(user.lastLoginAt!.getTime()).toBeGreaterThanOrEqual(beforeLogin.getTime());
    expect(user.lastLoginAt!.getTime()).toBeLessThanOrEqual(afterLogin.getTime());

    const persistedUser = await repository.findByEmail("marta@escola.com");
    expect(persistedUser?.lastLoginAt).toEqual(user.lastLoginAt);
  });

  it("chama updateLastLoginAt a cada novo login bem-sucedido, não apenas no primeiro", async () => {
    const repository = new InMemoryUserRepository();
    await seedUser(repository, "marta@escola.com", "senha-correta-123");
    const authenticateUser = new AuthenticateUser(repository);
    const updateLastLoginAtSpy = jest.spyOn(repository, "updateLastLoginAt");

    await authenticateUser.execute({
      email: "marta@escola.com",
      password: "senha-correta-123",
    });
    await authenticateUser.execute({
      email: "marta@escola.com",
      password: "senha-correta-123",
    });

    expect(updateLastLoginAtSpy).toHaveBeenCalledTimes(2);
  });

  it("não atualiza lastLoginAt quando a senha está incorreta", async () => {
    const repository = new InMemoryUserRepository();
    await seedUser(repository, "marta@escola.com", "senha-correta-123");
    const authenticateUser = new AuthenticateUser(repository);

    await expect(
      authenticateUser.execute({
        email: "marta@escola.com",
        password: "senha-errada",
      }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);

    const user = await repository.findByEmail("marta@escola.com");
    expect(user?.lastLoginAt).toBeNull();
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
