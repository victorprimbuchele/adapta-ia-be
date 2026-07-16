import bcrypt from "bcrypt";

import { EmailAlreadyInUseError, WeakPasswordError } from "../domain/errors.js";
import { RegisterUser } from "./register-user.js";
import { InMemoryUserRepository } from "./test-utils/in-memory-user-repository.js";

describe("RegisterUser", () => {
  it("persiste a senha apenas como hash bcrypt, nunca em texto puro", async () => {
    const repository = new InMemoryUserRepository();
    const registerUser = new RegisterUser(repository);
    const plainPassword = "SenhaForte123";

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
    const plainPassword = "SenhaForte123";

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
      password: "SenhaForte123",
    });

    await expect(
      registerUser.execute({
        name: "Marta Silva",
        email: "marta@escola.com",
        password: "OutraSenha456",
      }),
    ).rejects.toBeInstanceOf(EmailAlreadyInUseError);
  });

  it("não sobrescreve o usuário já cadastrado ao rejeitar e-mail duplicado", async () => {
    const repository = new InMemoryUserRepository();
    const registerUser = new RegisterUser(repository);

    await registerUser.execute({
      name: "Marta Silva",
      email: "marta@escola.com",
      password: "SenhaForte123",
    });

    await expect(
      registerUser.execute({
        name: "Outra Pessoa",
        email: "marta@escola.com",
        password: "OutraSenha456",
      }),
    ).rejects.toBeInstanceOf(EmailAlreadyInUseError);

    const user = await repository.findByEmail("marta@escola.com");
    expect(user?.name).toBe("Marta Silva");
  });

  it.each([
    ["curta demais", "Ab1defg"],
    ["sem letra maiúscula", "senhafraca123"],
    ["sem letra minúscula", "SENHAFRACA123"],
    ["sem número", "SenhaSemNumero"],
  ])("rejeita cadastro com senha fraca (%s)", async (_descricao, weakPassword) => {
    const repository = new InMemoryUserRepository();
    const registerUser = new RegisterUser(repository);

    await expect(
      registerUser.execute({
        name: "Marta Silva",
        email: "marta@escola.com",
        password: weakPassword,
      }),
    ).rejects.toBeInstanceOf(WeakPasswordError);
  });

  it("não persiste o usuário quando a senha é considerada fraca", async () => {
    const repository = new InMemoryUserRepository();
    const registerUser = new RegisterUser(repository);

    await expect(
      registerUser.execute({
        name: "Marta Silva",
        email: "marta@escola.com",
        password: "fraca123",
      }),
    ).rejects.toBeInstanceOf(WeakPasswordError);

    const user = await repository.findByEmail("marta@escola.com");
    expect(user).toBeNull();
  });
});
