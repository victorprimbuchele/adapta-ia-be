import bcrypt from "bcrypt";

import { EmailAlreadyInUseError } from "../domain/errors.js";
import { RegisterUser } from "./register-user.js";
import { InMemoryUserRepository } from "./test-utils/in-memory-user-repository.js";

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
