/**
 * Série — dado de referência fixo, sem cadastro dinâmico no MVP (ver ADR
 * "Cadastro de Escola/Série" e Épico 2). Populado via `prisma/seed.ts`.
 * `sortOrder` define a ordem de exibição nas listagens.
 */
export interface Grade {
  id: string;
  name: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}
