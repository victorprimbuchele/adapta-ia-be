import { ListClassHomeworks } from "./list-class-homeworks.js";
import {
  ClassAccessDeniedError,
  ClassNotFoundError,
} from "../../escola/domain/errors.js";
import { InMemoryClassRepository } from "../../escola/application/test-utils/in-memory-class-repository.js";
import { InMemoryHomeworkRepository } from "./test-utils/in-memory-homework-repository.js";

async function buildScenario() {
  const classRepository = new InMemoryClassRepository();
  const homeworkRepository = new InMemoryHomeworkRepository();
  const listClassHomeworks = new ListClassHomeworks(
    classRepository,
    homeworkRepository,
  );
  const createdClass = await classRepository.create({
    name: "Turma A",
    schoolId: "school-1",
    gradeId: "grade-1",
    teacherId: "teacher-1",
  });

  return {
    createdClass,
    homeworkRepository,
    listClassHomeworks,
  };
}

describe("ListClassHomeworks", () => {
  it("retorna lista vazia quando a turma não tem atividades", async () => {
    const { createdClass, listClassHomeworks } = await buildScenario();

    const homeworks = await listClassHomeworks.execute(
      createdClass.id,
      "teacher-1",
    );

    expect(homeworks).toEqual([]);
  });

  it("lista apenas as geradoras da turma, mais recentes primeiro", async () => {
    const { createdClass, homeworkRepository, listClassHomeworks } =
      await buildScenario();

    const older = await homeworkRepository.createGenerator({
      title: "Atividade antiga",
      content: "Conteúdo antigo",
      classId: createdClass.id,
      teacherId: "teacher-1",
    });
    older.createdAt = new Date("2026-01-01T10:00:00.000Z");

    const newer = await homeworkRepository.createGenerator({
      title: "Atividade recente",
      content: "Conteúdo recente",
      classId: createdClass.id,
      teacherId: "teacher-1",
    });
    newer.createdAt = new Date("2026-06-01T10:00:00.000Z");

    await homeworkRepository.createGenerator({
      title: "Outra turma",
      content: "Não deve aparecer",
      classId: "outra-turma",
      teacherId: "teacher-1",
    });

    const now = new Date();
    homeworkRepository.homeworks.push({
      id: "adaptation-1",
      title: "Variante",
      content: "Não deve aparecer na listagem",
      glossary: null,
      isDraft: false,
      homeworkId: newer.id,
      learningProfileId: "profile-1",
      classId: createdClass.id,
      teacherId: "teacher-1",
      createdAt: now,
      updatedAt: now,
    });

    const homeworks = await listClassHomeworks.execute(
      createdClass.id,
      "teacher-1",
    );

    expect(homeworks).toHaveLength(2);
    expect(homeworks.map((homework) => homework.id)).toEqual([
      newer.id,
      older.id,
    ]);
    expect(homeworks.every((homework) => homework.homeworkId === null)).toBe(
      true,
    );
  });

  it("rejeita quando a turma não existe", async () => {
    const { listClassHomeworks } = await buildScenario();

    await expect(
      listClassHomeworks.execute("turma-inexistente", "teacher-1"),
    ).rejects.toBeInstanceOf(ClassNotFoundError);
  });

  it("nega acesso quando a turma pertence a outro professor", async () => {
    const { createdClass, listClassHomeworks } = await buildScenario();

    await expect(
      listClassHomeworks.execute(createdClass.id, "teacher-2"),
    ).rejects.toBeInstanceOf(ClassAccessDeniedError);
  });
});
