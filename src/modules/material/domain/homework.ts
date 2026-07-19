/**
 * Atividade (Homework) — material criado pelo professor via formulário
 * estruturado (ver Épico 4, BE-E4.1). A geradora nasce como rascunho
 * (`isDraft = true`) sem vínculo a outra homework nem a perfil de
 * aprendizagem (`homeworkId` e `learningProfileId` nulos).
 */
export interface Homework {
  id: string;
  title: string;
  content: string;
  isDraft: boolean;
  homeworkId: string | null;
  learningProfileId: string | null;
  teacherId: string;
  createdAt: Date;
  updatedAt: Date;
}
