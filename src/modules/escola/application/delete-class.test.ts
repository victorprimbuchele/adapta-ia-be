import { DeleteClass } from "./delete-class.js";
import {
  ClassAccessDeniedError,
  ClassNotFoundError,
} from "../domain/errors.js";
import { InMemoryClassRepository } from "./test-utils/in-memory-class-repository.js";

describe("DeleteClass", () => {
  it("marca deletedAt sem remover o registro, e a turma some das listagens e do detalhe", async () => {
    const classRepository = new InMemoryClassRepository();
    const createdClass = await classRepository.create({
      name: "Turma A",
      schoolId: "school-1",
      gradeId: "grade-1",
      teacherId: "teacher-1",
    });
    const deleteClass = new DeleteClass(classRepository);

    await deleteClass.execute(createdClass.id, "teacher-1");

    expect(classRepository.classes).toHaveLength(1);
    expect(classRepository.classes[0]?.deletedAt).not.toBeNull();
    expect(await classRepository.findById(createdClass.id)).toBeNull();
    expect(await classRepository.findByTeacherId("teacher-1")).toEqual([]);
  });

  it("rejeita quando a turma não existe", async () => {
    const classRepository = new InMemoryClassRepository();
    const deleteClass = new DeleteClass(classRepository);

    await expect(
      deleteClass.execute("turma-inexistente", "teacher-1"),
    ).rejects.toBeInstanceOf(ClassNotFoundError);
  });

  it("nega exclusão quando a turma pertence a outro professor", async () => {
    const classRepository = new InMemoryClassRepository();
    const createdClass = await classRepository.create({
      name: "Turma A",
      schoolId: "school-1",
      gradeId: "grade-1",
      teacherId: "teacher-1",
    });
    const deleteClass = new DeleteClass(classRepository);

    await expect(
      deleteClass.execute(createdClass.id, "teacher-2"),
    ).rejects.toBeInstanceOf(ClassAccessDeniedError);

    expect(classRepository.classes[0]?.deletedAt).toBeNull();
  });
});
