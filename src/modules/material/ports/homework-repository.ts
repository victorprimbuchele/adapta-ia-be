import type { Homework } from "../domain/homework.js";

export interface CreateGeneratorHomeworkData {
  title: string;
  content: string;
  teacherId: string;
}

export interface UpdateDraftHomeworkData {
  title: string;
  content: string;
}

export interface HomeworkRepository {
  /**
   * Persiste uma homework geradora como rascunho, sem perfil de
   * aprendizagem e sem homework pai (ver Épico 4, BE-E4.1).
   */
  createGenerator(data: CreateGeneratorHomeworkData): Promise<Homework>;

  findById(id: string): Promise<Homework | null>;

  /**
   * Atualiza título e conteúdo de um rascunho existente. Não cria
   * adaptações/variantes (ver Épico 4, BE-E4.3).
   */
  updateDraft(id: string, data: UpdateDraftHomeworkData): Promise<Homework>;
}
