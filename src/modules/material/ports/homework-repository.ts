import type { GlossaryEntry } from "../domain/glossary.js";
import type { Homework } from "../domain/homework.js";

export interface CreateGeneratorHomeworkData {
  title: string;
  content: string;
  classId: string;
  teacherId: string;
}

export interface UpdateDraftHomeworkData {
  title: string;
  content: string;
}

/** Dados da variante adaptada (BE-E5.5): sempre vinculada à geradora e ao perfil. */
export interface UpsertAdaptationHomeworkData {
  title: string;
  content: string;
  glossary: GlossaryEntry[] | null;
  homeworkId: string;
  learningProfileId: string;
  classId: string;
  teacherId: string;
}

export interface HomeworkRepository {
  /**
   * Persiste uma homework geradora como rascunho, sem perfil de
   * aprendizagem e sem homework pai (ver Épico 4, BE-E4.1).
   */
  createGenerator(data: CreateGeneratorHomeworkData): Promise<Homework>;

  findById(id: string): Promise<Homework | null>;

  /**
   * Lista as adaptações/variantes vinculadas a uma homework geradora
   * (`homeworkId` = id da geradora) — ver Épico 4, BE-E4.4.
   */
  findAdaptationsByHomeworkId(homeworkId: string): Promise<Homework[]>;

  /**
   * Lista as homeworks geradoras de uma turma (`classId`, `homeworkId`
   * null) — ver Épico 4, BE-E4.5.
   */
  findGeneratorsByClassId(classId: string): Promise<Homework[]>;

  /**
   * Atualiza título e conteúdo de um rascunho existente. Não cria
   * adaptações/variantes (ver Épico 4, BE-E4.3).
   */
  updateDraft(id: string, data: UpdateDraftHomeworkData): Promise<Homework>;

  /**
   * Cria ou atualiza a Homework variante para o par geradora+perfil
   * (`homeworkId` = geradora, `learningProfileId` preenchido, `glossary`
   * estruturado quando o perfil pede) — Épico 5, BE-E5.5 / BE-E5.4.
   */
  upsertAdaptation(data: UpsertAdaptationHomeworkData): Promise<Homework>;
}
