import jwt, { type SignOptions } from "jsonwebtoken";

const rawSecret = process.env["JWT_SECRET"];
if (!rawSecret) {
  throw new Error("JWT_SECRET não configurado.");
}

const JWT_SECRET: string = rawSecret;
const JWT_EXPIRES_IN = (process.env["JWT_EXPIRES_IN"] ??
  "15m") as SignOptions["expiresIn"];

export interface AccessTokenPayload {
  sub: string;
  email: string;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, JWT_SECRET);
  return decoded as unknown as AccessTokenPayload;
}
