import { UserNotFoundError } from "../domain/errors.js";
import { GetAuthenticatedUser } from "./get-authenticated-user.js";
import { InMemoryUserRepository } from "./test-utils/in-memory-user-repository.js";

describe("GetAuthenticatedUser", () => {
  it("retorna os dados do usuário correspondente ao id do token", async () => {
    const repository = new InMemoryUserRepository();
    const createdUser = await repository.create({
      name: "Marta Silva",
      email: "marta@escola.com",
      passwordHash: "hash-irrelevante-para-este-teste",
    });
    const getAuthenticatedUser = new GetAuthenticatedUser(repository);

    const user = await getAuthenticatedUser.execute(createdUser.id);

    expect(user.id).toBe(createdUser.id);
    expect(user.name).toBe("Marta Silva");
    expect(user.email).toBe("marta@escola.com");
  });

  it("rejeita com UserNotFoundError quando o id do token não corresponde a nenhum usuário", async () => {
    const repository = new InMemoryUserRepository();
    const getAuthenticatedUser = new GetAuthenticatedUser(repository);

    await expect(
      getAuthenticatedUser.execute("id-inexistente"),
    ).rejects.toBeInstanceOf(UserNotFoundError);
  });
});
