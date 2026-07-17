/**
 * Aluno vinculado a turmas via `UserClass` (ver Épico 3, BE-E3.1). Do ponto
 * de vista do módulo `escola`, aluno é a mesma entidade `User` do módulo
 * `usuario` — apenas `name`/`email` importam para a vinculação e exibição.
 */
export interface Student {
  id: string;
  name: string;
  email: string;
}
