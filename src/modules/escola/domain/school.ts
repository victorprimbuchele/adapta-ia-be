/**
 * Escola — dado de referência fixo, sem cadastro dinâmico no MVP (ver ADR
 * "Cadastro de Escola/Série" e Épico 2). Populado via `prisma/seed.ts`.
 */
export interface School {
  id: string;
  name: string;
  city: string;
  state: string;
  createdAt: Date;
  updatedAt: Date;
}
