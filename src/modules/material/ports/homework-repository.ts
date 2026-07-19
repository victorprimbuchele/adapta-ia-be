import type { Homework } from "../domain/homework.js";

export interface CreateGeneratorHomeworkData {
  title: string;
  content: string;
  teacherId: string;
}

export interface HomeworkRepository {
  /**
   * Persiste uma homework geradora como rascunho, sem perfil de
   * aprendizagem e sem homework pai (ver Épico 4, BE-E4.1).
   */
  createGenerator(data: CreateGeneratorHomeworkData): Promise<Homework>;
}
