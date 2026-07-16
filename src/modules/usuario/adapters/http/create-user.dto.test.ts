import { createUserSchema } from "./create-user.dto.js";

function buildInput(password: string) {
  return { name: "Marta Silva", email: "marta@escola.com", password };
}

describe("createUserSchema", () => {
  it("aceita uma senha forte (minúscula, maiúscula, número e 8+ caracteres)", () => {
    const result = createUserSchema.safeParse(buildInput("SenhaForte123"));

    expect(result.success).toBe(true);
  });

  it("rejeita senha curta demais, com mensagem clara", () => {
    const result = createUserSchema.safeParse(buildInput("Ab1"));

    expect(result.success).toBe(false);
    const messages = result.success ? [] : result.error.issues.map((issue) => issue.message);
    expect(messages).toContain("Senha deve ter pelo menos 8 caracteres.");
  });

  it("rejeita senha sem letra maiúscula, com mensagem clara", () => {
    const result = createUserSchema.safeParse(buildInput("senhafraca123"));

    expect(result.success).toBe(false);
    const messages = result.success ? [] : result.error.issues.map((issue) => issue.message);
    expect(messages).toContain("Senha deve conter ao menos uma letra maiúscula.");
  });

  it("rejeita senha sem letra minúscula, com mensagem clara", () => {
    const result = createUserSchema.safeParse(buildInput("SENHAFRACA123"));

    expect(result.success).toBe(false);
    const messages = result.success ? [] : result.error.issues.map((issue) => issue.message);
    expect(messages).toContain("Senha deve conter ao menos uma letra minúscula.");
  });

  it("rejeita senha sem número, com mensagem clara", () => {
    const result = createUserSchema.safeParse(buildInput("SenhaSemNumero"));

    expect(result.success).toBe(false);
    const messages = result.success ? [] : result.error.issues.map((issue) => issue.message);
    expect(messages).toContain("Senha deve conter ao menos um número.");
  });

  it("acumula todas as mensagens de senha fraca quando múltiplas regras falham", () => {
    const result = createUserSchema.safeParse(buildInput("abc"));

    expect(result.success).toBe(false);
    const messages = result.success ? [] : result.error.issues.map((issue) => issue.message);
    expect(messages).toEqual(
      expect.arrayContaining([
        "Senha deve ter pelo menos 8 caracteres.",
        "Senha deve conter ao menos uma letra maiúscula.",
        "Senha deve conter ao menos um número.",
      ]),
    );
  });
});
