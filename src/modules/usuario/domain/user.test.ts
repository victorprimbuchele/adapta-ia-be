import { toPublicUser, type User } from "./user.js";

describe("toPublicUser", () => {
  it("nunca inclui o hash da senha na resposta da API", () => {
    const user: User = {
      id: "user-1",
      name: "Marta Silva",
      email: "marta@escola.com",
      passwordHash: "$2b$10$abclongbcrypthashvaluexxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const publicUser = toPublicUser(user);

    expect(publicUser).not.toHaveProperty("passwordHash");
    expect(JSON.stringify(publicUser)).not.toContain(user.passwordHash);
  });
});
