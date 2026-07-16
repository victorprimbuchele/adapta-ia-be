import type { NextFunction, Request, Response } from "express";

import { authenticate } from "./authenticate.js";
import { ExpiredTokenError, InvalidTokenError, MissingTokenError } from "./errors.js";
import { signAccessToken } from "./jwt.js";

function buildRequest(authorization?: string): Request {
  return { headers: { authorization } } as unknown as Request;
}

describe("authenticate", () => {
  it("chama next() sem erro e popula req.user quando o token é válido", () => {
    const token = signAccessToken({ sub: "user-1", email: "marta@escola.com" });
    const req = buildRequest(`Bearer ${token}`);
    const next = jest.fn() as unknown as NextFunction;

    authenticate(req, {} as Response, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.user).toMatchObject({ sub: "user-1", email: "marta@escola.com" });
  });

  it("rejeita com MissingTokenError quando não há header Authorization", () => {
    const req = buildRequest(undefined);
    const next = jest.fn() as unknown as NextFunction;

    authenticate(req, {} as Response, next);

    expect(next).toHaveBeenCalledWith(expect.any(MissingTokenError));
  });

  it("rejeita com MissingTokenError quando o header não usa o esquema Bearer", () => {
    const req = buildRequest("Basic abc123");
    const next = jest.fn() as unknown as NextFunction;

    authenticate(req, {} as Response, next);

    expect(next).toHaveBeenCalledWith(expect.any(MissingTokenError));
  });

  it("rejeita com MissingTokenError quando o Bearer token está vazio", () => {
    const req = buildRequest("Bearer ");
    const next = jest.fn() as unknown as NextFunction;

    authenticate(req, {} as Response, next);

    expect(next).toHaveBeenCalledWith(expect.any(MissingTokenError));
  });

  it("rejeita com InvalidTokenError quando o token é adulterado/malformado", () => {
    const token = signAccessToken({ sub: "user-1", email: "marta@escola.com" });
    const req = buildRequest(`Bearer ${token}tampered`);
    const next = jest.fn() as unknown as NextFunction;

    authenticate(req, {} as Response, next);

    expect(next).toHaveBeenCalledWith(expect.any(InvalidTokenError));
  });

  it("rejeita com ExpiredTokenError quando o token está expirado", () => {
    const token = signAccessToken({ sub: "user-1", email: "marta@escola.com" }, "-1s");
    const req = buildRequest(`Bearer ${token}`);
    const next = jest.fn() as unknown as NextFunction;

    authenticate(req, {} as Response, next);

    expect(next).toHaveBeenCalledWith(expect.any(ExpiredTokenError));
  });

  it("nunca popula req.user quando o token é inválido", () => {
    const req = buildRequest("Bearer token-invalido");
    const next = jest.fn() as unknown as NextFunction;

    authenticate(req, {} as Response, next);

    expect(req.user).toBeUndefined();
  });
});
