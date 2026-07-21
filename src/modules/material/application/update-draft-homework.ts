import type { Homework } from "../domain/homework.js";
import { HomeworkNotDraftError } from "../domain/errors.js";
import type { HomeworkRepository } from "../ports/homework-repository.js";
import { authorizeHomeworkOwner } from "./authorize-homework-owner.js";

export interface UpdateDraftHomeworkInput {
  homeworkId: string;
  teacherId: string;
  title: string;
  content: string;
  subject?: string | null;
  question?: string | null;
}

/**
 * Atualiza um rascunho de homework do professor autenticado (Épico 4,
 * BE-E4.3). Salva título e conteúdo sem gerar adaptações/variantes.
 */
export class UpdateDraftHomework {
  constructor(private readonly homeworkRepository: HomeworkRepository) {}

  async execute(input: UpdateDraftHomeworkInput): Promise<Homework> {
    const homework = await authorizeHomeworkOwner(
      this.homeworkRepository,
      input.homeworkId,
      input.teacherId,
    );

    if (!homework.isDraft) {
      throw new HomeworkNotDraftError(input.homeworkId);
    }

    return this.homeworkRepository.updateDraft(input.homeworkId, {
      title: input.title,
      content: input.content,
      subject: input.subject,
      question: input.question,
    });
  }
}
