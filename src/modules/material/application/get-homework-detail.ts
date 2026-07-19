import { authorizeHomeworkOwner } from "./authorize-homework-owner.js";
import type { HomeworkDetail } from "../domain/homework.js";
import type { HomeworkRepository } from "../ports/homework-repository.js";

/**
 * Obtém o detalhe de uma homework, incluindo as adaptações/variantes
 * vinculadas (ver Épico 4, BE-E4.4). A autorização por `teacherId` é
 * delegada a `authorizeHomeworkOwner`, garantindo que apenas o professor
 * responsável acesse a atividade.
 */
export class GetHomeworkDetail {
  constructor(private readonly homeworkRepository: HomeworkRepository) {}

  async execute(
    homeworkId: string,
    teacherId: string,
  ): Promise<HomeworkDetail> {
    const homework = await authorizeHomeworkOwner(
      this.homeworkRepository,
      homeworkId,
      teacherId,
    );

    const adaptations =
      await this.homeworkRepository.findAdaptationsByHomeworkId(homework.id);

    return { ...homework, adaptations };
  }
}
