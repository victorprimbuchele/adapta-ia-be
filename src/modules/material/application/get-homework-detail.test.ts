import { GetHomeworkDetail } from "./get-homework-detail.js";
import {
  HomeworkAccessDeniedError,
  HomeworkNotFoundError,
} from "../domain/errors.js";
import { InMemoryHomeworkRepository } from "./test-utils/in-memory-homework-repository.js";

describe("GetHomeworkDetail", () => {
  it("retorna a geradora com lista vazia quando ainda não há variantes", async () => {
    const homeworkRepository = new InMemoryHomeworkRepository();
    const generator = await homeworkRepository.createGenerator({
      title: "Frações equivalentes",
      content: "Conteúdo da geradora",
      classId: "class-1",
      teacherId: "teacher-1",
    });
    const getHomeworkDetail = new GetHomeworkDetail(homeworkRepository);

    const detail = await getHomeworkDetail.execute(generator.id, "teacher-1");

    expect(detail).toMatchObject({
      id: generator.id,
      title: "Frações equivalentes",
      content: "Conteúdo da geradora",
      classId: "class-1",
      teacherId: "teacher-1",
      isDraft: true,
      homeworkId: null,
      learningProfileId: null,
      adaptations: [],
    });
  });

  it("retorna a geradora com as variantes vinculadas", async () => {
    const homeworkRepository = new InMemoryHomeworkRepository();
    const generator = await homeworkRepository.createGenerator({
      title: "Frações equivalentes",
      content: "Conteúdo da geradora",
      classId: "class-1",
      teacherId: "teacher-1",
    });

    const now = new Date();
    homeworkRepository.homeworks.push(
      {
        id: "adaptation-1",
        title: "Frações — perfil P1",
        content: "Variante simplificada",
        glossary: [
          { term: "fração", definition: "parte de um todo" },
        ],
        isDraft: false,
        homeworkId: generator.id,
        learningProfileId: "profile-1",
        classId: "class-1",
        teacherId: "teacher-1",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "adaptation-2",
        title: "Frações — perfil P2",
        content: "Variante com microtarefas",
        glossary: null,
        isDraft: false,
        homeworkId: generator.id,
        learningProfileId: "profile-2",
        classId: "class-1",
        teacherId: "teacher-1",
        createdAt: new Date(now.getTime() + 1000),
        updatedAt: new Date(now.getTime() + 1000),
      },
    );

    const getHomeworkDetail = new GetHomeworkDetail(homeworkRepository);

    const detail = await getHomeworkDetail.execute(generator.id, "teacher-1");

    expect(detail.adaptations).toHaveLength(2);
    expect(detail.adaptations).toEqual([
      expect.objectContaining({
        id: "adaptation-1",
        homeworkId: generator.id,
        learningProfileId: "profile-1",
        glossary: [{ term: "fração", definition: "parte de um todo" }],
      }),
      expect.objectContaining({
        id: "adaptation-2",
        homeworkId: generator.id,
        learningProfileId: "profile-2",
      }),
    ]);
  });

  it("rejeita quando a homework não existe", async () => {
    const homeworkRepository = new InMemoryHomeworkRepository();
    const getHomeworkDetail = new GetHomeworkDetail(homeworkRepository);

    await expect(
      getHomeworkDetail.execute("homework-inexistente", "teacher-1"),
    ).rejects.toBeInstanceOf(HomeworkNotFoundError);
  });

  it("nega acesso quando a homework existe mas não pertence ao professor autenticado", async () => {
    const homeworkRepository = new InMemoryHomeworkRepository();
    const generator = await homeworkRepository.createGenerator({
      title: "Frações equivalentes",
      content: "Conteúdo da geradora",
      classId: "class-1",
      teacherId: "teacher-1",
    });
    const getHomeworkDetail = new GetHomeworkDetail(homeworkRepository);

    await expect(
      getHomeworkDetail.execute(generator.id, "teacher-2"),
    ).rejects.toBeInstanceOf(HomeworkAccessDeniedError);
  });
});
