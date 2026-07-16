import { signAccessToken, verifyAccessToken } from "./jwt.js";

describe("jwt", () => {
  it("gera um token válido que pode ser verificado e contém o payload original", () => {
    const token = signAccessToken({ sub: "user-1", email: "marta@escola.com" });

    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3); // header.payload.signature

    const decoded = verifyAccessToken(token);

    expect(decoded.sub).toBe("user-1");
    expect(decoded.email).toBe("marta@escola.com");
  });

  it("rejeita um token adulterado/inválido", () => {
    const token = signAccessToken({ sub: "user-1", email: "marta@escola.com" });
    const tamperedToken = `${token}tampered`;

    expect(() => verifyAccessToken(tamperedToken)).toThrow();
  });
});
