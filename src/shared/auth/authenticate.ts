import type { NextFunction, Request, Response } from "express";
import { TokenExpiredError } from "jsonwebtoken";

import { ExpiredTokenError, InvalidTokenError, MissingTokenError } from "./errors.js";
import { verifyAccessToken, type AccessTokenPayload } from "./jwt.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AccessTokenPayload;
    }
  }
}

const BEARER_PREFIX = "Bearer ";

function extractToken(authorizationHeader: string | undefined): string {
  if (!authorizationHeader?.startsWith(BEARER_PREFIX)) {
    throw new MissingTokenError();
  }

  const token = authorizationHeader.slice(BEARER_PREFIX.length).trim();
  if (!token) {
    throw new MissingTokenError();
  }

  return token;
}

/**
 * Middleware de autorização: exige um Bearer token JWT válido no header
 * `Authorization`. Quando válido, popula `req.user` com o payload do token;
 * caso contrário, encaminha um `AppError` 401 para o middleware de erro
 * global (sem token, token malformado/inválido ou expirado).
 */
export function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  try {
    const token = extractToken(req.headers.authorization);
    req.user = verifyAccessToken(token);
  } catch (error) {
    if (error instanceof MissingTokenError) {
      next(error);
      return;
    }
    if (error instanceof TokenExpiredError) {
      next(new ExpiredTokenError());
      return;
    }
    next(new InvalidTokenError());
    return;
  }

  next();
}
