export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Dados de `User` seguros para expor via API (nunca inclui `passwordHash`). */
export type PublicUser = Omit<User, "passwordHash">;

export function toPublicUser(user: User): PublicUser {
  const { passwordHash: _passwordHash, ...publicUser } = user;
  return publicUser;
}
