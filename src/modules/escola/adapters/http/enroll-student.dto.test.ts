import { enrollStudentSchema } from "./enroll-student.dto.js";

function buildInput(overrides: Record<string, unknown> = {}) {
  return {
    name: "João Souza",
    email: "joao@escola.com",
    ...overrides,
  };
}

describe("enrollStudentSchema", () => {
  it("aceita nome e e-mail válidos (e-mail normalizado em minúsculas)", () => {
    const result = enrollStudentSchema.safeParse(
      buildInput({ email: "Joao@Escola.COM" }),
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("joao@escola.com");
    }
  });

  it("rejeita cadastro sem e-mail", () => {
    const result = enrollStudentSchema.safeParse({ name: "João Souza" });

    expect(result.success).toBe(false);
    const messages = result.success
      ? []
      : result.error.issues.map((issue) => issue.message);
    expect(messages).toContain("E-mail do aluno é obrigatório.");
  });

  it("rejeita e-mail vazio ou só com espaços", () => {
    for (const email of ["", "   "]) {
      const result = enrollStudentSchema.safeParse(buildInput({ email }));

      expect(result.success).toBe(false);
      const messages = result.success
        ? []
        : result.error.issues.map((issue) => issue.message);
      expect(messages).toContain("E-mail do aluno é obrigatório.");
    }
  });

  it("rejeita e-mail inválido", () => {
    for (const email of ["invalido", "a@b", "joao@", "@escola.com"]) {
      const result = enrollStudentSchema.safeParse(buildInput({ email }));

      expect(result.success).toBe(false);
      const messages = result.success
        ? []
        : result.error.issues.map((issue) => issue.message);
      expect(messages).toContain("E-mail inválido.");
    }
  });
});
