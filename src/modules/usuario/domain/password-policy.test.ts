import { getWeakPasswordReasons, isWeakPassword } from "./password-policy.js";

describe("password-policy", () => {
  it("considera fraca uma senha com menos de 8 caracteres", () => {
    expect(isWeakPassword("Ab1")).toBe(true);
  });

  it("considera fraca uma senha sem letra maiúscula", () => {
    expect(isWeakPassword("senhaforte123")).toBe(true);
  });

  it("considera fraca uma senha sem letra minúscula", () => {
    expect(isWeakPassword("SENHAFORTE123")).toBe(true);
  });

  it("considera fraca uma senha sem nenhum número", () => {
    expect(isWeakPassword("SenhaSemNumero")).toBe(true);
  });

  it("considera forte uma senha com minúscula, maiúscula, número e 8+ caracteres", () => {
    expect(isWeakPassword("SenhaForte123")).toBe(false);
  });

  it("acumula todos os motivos de fraqueza de uma senha muito ruim", () => {
    const reasons = getWeakPasswordReasons("abc");

    expect(reasons).toEqual(
      expect.arrayContaining([
        "Senha deve ter pelo menos 8 caracteres.",
        "Senha deve conter ao menos uma letra maiúscula.",
        "Senha deve conter ao menos um número.",
      ]),
    );
  });

  it("não aponta nenhum motivo quando a senha atende à política", () => {
    expect(getWeakPasswordReasons("SenhaForte123")).toEqual([]);
  });
});
