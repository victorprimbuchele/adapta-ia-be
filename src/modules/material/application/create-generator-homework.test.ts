import { CreateGeneratorHomework } from "./create-generator-homework.js";
import {
  ClassAccessDeniedError,
  ClassNotFoundError,
} from "../../escola/domain/errors.js";
import { InMemoryClassRepository } from "../../escola/application/test-utils/in-memory-class-repository.js";
import { TeacherNotFoundError } from "../domain/errors.js";
import { InMemoryHomeworkRepository } from "./test-utils/in-memory-homework-repository.js";
import { InMemoryTeacherRepository } from "./test-utils/in-memory-teacher-repository.js";

describe("CreateGeneratorHomework", () => {
  it("cria a homework geradora como rascunho vinculada à turma", async () => {
    const homeworkRepository = new InMemoryHomeworkRepository();
    const teacherRepository = new InMemoryTeacherRepository([
      { id: "teacher-1" },
    ]);
    const classRepository = new InMemoryClassRepository();
    const createdClass = await classRepository.create({
      name: "Turma A",
      schoolId: "school-1",
      gradeId: "grade-1",
      teacherId: "teacher-1",
    });
    const createGeneratorHomework = new CreateGeneratorHomework(
      homeworkRepository,
      teacherRepository,
      classRepository,
    );

    const homework = await createGeneratorHomework.execute({
      title: "Interpretação de texto",
      content: "Leia o texto e responda às perguntas.",
      classId: createdClass.id,
      teacherId: "teacher-1",
    });

    expect(homework).toMatchObject({
      title: "Interpretação de texto",
      content: "Leia o texto e responda às perguntas.",
      classId: createdClass.id,
      teacherId: "teacher-1",
      glossary: null,
      isDraft: true,
      homeworkId: null,
      learningProfileId: null,
      audioFileId: null,
    });
    expect(homeworkRepository.homeworks).toHaveLength(1);
  });

  it("rejeita a criação quando o professor responsável não existe", async () => {
    const homeworkRepository = new InMemoryHomeworkRepository();
    const teacherRepository = new InMemoryTeacherRepository([
      { id: "teacher-1" },
    ]);
    const classRepository = new InMemoryClassRepository();
    const createGeneratorHomework = new CreateGeneratorHomework(
      homeworkRepository,
      teacherRepository,
      classRepository,
    );

    await expect(
      createGeneratorHomework.execute({
        title: "Interpretação de texto",
        content: "Leia o texto e responda às perguntas.",
        classId: "class-1",
        teacherId: "professor-inexistente",
      }),
    ).rejects.toBeInstanceOf(TeacherNotFoundError);
    expect(homeworkRepository.homeworks).toHaveLength(0);
  });

  it("rejeita a criação quando a turma não existe", async () => {
    const homeworkRepository = new InMemoryHomeworkRepository();
    const teacherRepository = new InMemoryTeacherRepository([
      { id: "teacher-1" },
    ]);
    const classRepository = new InMemoryClassRepository();
    const createGeneratorHomework = new CreateGeneratorHomework(
      homeworkRepository,
      teacherRepository,
      classRepository,
    );

    await expect(
      createGeneratorHomework.execute({
        title: "Interpretação de texto",
        content: "Leia o texto e responda às perguntas.",
        classId: "turma-inexistente",
        teacherId: "teacher-1",
      }),
    ).rejects.toBeInstanceOf(ClassNotFoundError);
    expect(homeworkRepository.homeworks).toHaveLength(0);
  });

  it("nega a criação quando a turma pertence a outro professor", async () => {
    const homeworkRepository = new InMemoryHomeworkRepository();
    const teacherRepository = new InMemoryTeacherRepository([
      { id: "teacher-1" },
    ]);
    const classRepository = new InMemoryClassRepository();
    const createdClass = await classRepository.create({
      name: "Turma A",
      schoolId: "school-1",
      gradeId: "grade-1",
      teacherId: "teacher-2",
    });
    const createGeneratorHomework = new CreateGeneratorHomework(
      homeworkRepository,
      teacherRepository,
      classRepository,
    );

    await expect(
      createGeneratorHomework.execute({
        title: "Interpretação de texto",
        content: "Leia o texto e responda às perguntas.",
        classId: createdClass.id,
        teacherId: "teacher-1",
      }),
    ).rejects.toBeInstanceOf(ClassAccessDeniedError);
    expect(homeworkRepository.homeworks).toHaveLength(0);
  });
});
