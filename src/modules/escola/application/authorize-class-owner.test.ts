import { authorizeClassOwner } from "./authorize-class-owner.js";
import { ClassAccessDeniedError, ClassNotFoundError } from "../domain/errors.js";
import { InMemoryClassRepository } from "./test-utils/in-memory-class-repository.js";

describe("authorizeClassOwner", () => {
  it("retorna a turma quando ela pertence ao professor autenticado", async () => {
    const classRepository = new InMemoryClassRepository();
    const createdClass = await classRepository.create({
      name: "Turma A",
      schoolId: "school-1",
      gradeId: "grade-1",
      teacherId: "teacher-1",
    });

    const klass = await authorizeClassOwner(
      classRepository,
      createdClass.id,
      "teacher-1",
    );

    expect(klass).toMatchObject({ id: createdClass.id, teacherId: "teacher-1" });
  });

  it("rejeita com ClassNotFoundError (404) quando a turma não existe", async () => {
    const classRepository = new InMemoryClassRepository();

    await expect(
      authorizeClassOwner(classRepository, "turma-inexistente", "teacher-1"),
    ).rejects.toBeInstanceOf(ClassNotFoundError);
  });

  it("rejeita com ClassAccessDeniedError (403) quando a turma pertence a outro professor", async () => {
    const classRepository = new InMemoryClassRepository();
    const createdClass = await classRepository.create({
      name: "Turma A",
      schoolId: "school-1",
      gradeId: "grade-1",
      teacherId: "teacher-1",
    });

    await expect(
      authorizeClassOwner(classRepository, createdClass.id, "teacher-2"),
    ).rejects.toBeInstanceOf(ClassAccessDeniedError);
  });
});
