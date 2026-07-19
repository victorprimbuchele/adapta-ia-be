import { CreateGeneratorHomework } from "./create-generator-homework.js";
import { TeacherNotFoundError } from "../domain/errors.js";
import { InMemoryHomeworkRepository } from "./test-utils/in-memory-homework-repository.js";
import { InMemoryTeacherRepository } from "./test-utils/in-memory-teacher-repository.js";

describe("CreateGeneratorHomework", () => {
  it("cria a homework geradora como rascunho sem perfil de aprendizagem", async () => {
    const homeworkRepository = new InMemoryHomeworkRepository();
    const teacherRepository = new InMemoryTeacherRepository([
      { id: "teacher-1" },
    ]);
    const createGeneratorHomework = new CreateGeneratorHomework(
      homeworkRepository,
      teacherRepository,
    );

    const homework = await createGeneratorHomework.execute({
      title: "Interpretação de texto",
      content: "Leia o texto e responda às perguntas.",
      teacherId: "teacher-1",
    });

    expect(homework).toMatchObject({
      title: "Interpretação de texto",
      content: "Leia o texto e responda às perguntas.",
      teacherId: "teacher-1",
      isDraft: true,
      homeworkId: null,
      learningProfileId: null,
    });
    expect(homeworkRepository.homeworks).toHaveLength(1);
  });

  it("rejeita a criação quando o professor responsável não existe", async () => {
    const homeworkRepository = new InMemoryHomeworkRepository();
    const teacherRepository = new InMemoryTeacherRepository([
      { id: "teacher-1" },
    ]);
    const createGeneratorHomework = new CreateGeneratorHomework(
      homeworkRepository,
      teacherRepository,
    );

    await expect(
      createGeneratorHomework.execute({
        title: "Interpretação de texto",
        content: "Leia o texto e responda às perguntas.",
        teacherId: "professor-inexistente",
      }),
    ).rejects.toBeInstanceOf(TeacherNotFoundError);
    expect(homeworkRepository.homeworks).toHaveLength(0);
  });
});
