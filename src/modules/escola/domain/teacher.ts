/**
 * Referência mínima ao professor (usuário) responsável por uma turma, do
 * ponto de vista do módulo `escola` — apenas o necessário para validar que
 * ele existe antes de vinculá-lo a uma turma (ver Épico 2, BE-E2.8: turma
 * sempre precisa de escola, série e professor responsável).
 */
export interface Teacher {
  id: string;
}
