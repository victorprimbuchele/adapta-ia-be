import { UpdateDraftHomework } from "./update-draft-homework.js";
import {
  HomeworkAccessDeniedError,
  HomeworkNotDraftError,
  HomeworkNotFoundError,
} from "../domain/errors.js";
import { InMemoryHomeworkRepository } from "./test-utils/in-memory-homework-repository.js";

describe("UpdateDraftHomework", () => {
  it("salva alterações no rascunho sem gerar variantes", async () => {
    const homeworkRepository = new InMemoryHomeworkRepository();
    const draft = await homeworkRepository.createGenerator({
      title: "Título original",
      content: "Conteúdo original",
      classId: "class-1",
      teacherId: "teacher-1",
    });
    const updateDraftHomework = new UpdateDraftHomework(homeworkRepository);

    const updated = await updateDraftHomework.execute({
      homeworkId: draft.id,
      teacherId: "teacher-1",
      title: "Título atualizado",
      content: "Conteúdo atualizado",
    });

    expect(updated).toMatchObject({
      id: draft.id,
      title: "Título atualizado",
      content: "Conteúdo atualizado",
      classId: "class-1",
      teacherId: "teacher-1",
      isDraft: true,
      homeworkId: null,
      learningProfileId: null,
    });
    expect(homeworkRepository.homeworks).toHaveLength(1);
    expect(homeworkRepository.homeworks[0]).toMatchObject({
      title: "Título atualizado",
      content: "Conteúdo atualizado",
      homeworkId: null,
      learningProfileId: null,
    });
  });

  it("rejeita quando a homework não existe", async () => {
    const homeworkRepository = new InMemoryHomeworkRepository();
    const updateDraftHomework = new UpdateDraftHomework(homeworkRepository);

    await expect(
      updateDraftHomework.execute({
        homeworkId: "homework-inexistente",
        teacherId: "teacher-1",
        title: "Título",
        content: "Conteúdo",
      }),
    ).rejects.toBeInstanceOf(HomeworkNotFoundError);
    expect(homeworkRepository.homeworks).toHaveLength(0);
  });

  it("nega edição quando a homework pertence a outro professor", async () => {
    const homeworkRepository = new InMemoryHomeworkRepository();
    const draft = await homeworkRepository.createGenerator({
      title: "Título original",
      content: "Conteúdo original",
      classId: "class-1",
      teacherId: "teacher-1",
    });
    const updateDraftHomework = new UpdateDraftHomework(homeworkRepository);

    await expect(
      updateDraftHomework.execute({
        homeworkId: draft.id,
        teacherId: "teacher-2",
        title: "Título atualizado",
        content: "Conteúdo atualizado",
      }),
    ).rejects.toBeInstanceOf(HomeworkAccessDeniedError);

    expect(homeworkRepository.homeworks[0]).toMatchObject({
      title: "Título original",
      content: "Conteúdo original",
    });
  });

  it("rejeita edição quando a homework não é rascunho", async () => {
    const homeworkRepository = new InMemoryHomeworkRepository();
    const draft = await homeworkRepository.createGenerator({
      title: "Título original",
      content: "Conteúdo original",
      classId: "class-1",
      teacherId: "teacher-1",
    });
    const published = homeworkRepository.homeworks[0]!;
    published.isDraft = false;

    const updateDraftHomework = new UpdateDraftHomework(homeworkRepository);

    await expect(
      updateDraftHomework.execute({
        homeworkId: draft.id,
        teacherId: "teacher-1",
        title: "Título atualizado",
        content: "Conteúdo atualizado",
      }),
    ).rejects.toBeInstanceOf(HomeworkNotDraftError);

    expect(homeworkRepository.homeworks[0]).toMatchObject({
      title: "Título original",
      content: "Conteúdo original",
    });
  });
});
