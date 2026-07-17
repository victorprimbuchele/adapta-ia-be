import { GetClassDetail } from "./get-class-detail.js";
import { ClassAccessDeniedError, ClassNotFoundError } from "../domain/errors.js";
import { InMemoryClassRepository } from "./test-utils/in-memory-class-repository.js";

describe("GetClassDetail", () => {
  it("retorna o detalhe da turma, incluindo a lista (vazia) de alunos vinculados", async () => {
    const classRepository = new InMemoryClassRepository();
    const createdClass = await classRepository.create({
      name: "Turma A",
      schoolId: "school-1",
      gradeId: "grade-1",
      teacherId: "teacher-1",
    });
    const getClassDetail = new GetClassDetail(classRepository);

    const classDetail = await getClassDetail.execute(
      createdClass.id,
      "teacher-1",
    );

    expect(classDetail).toMatchObject({
      id: createdClass.id,
      name: "Turma A",
      teacherId: "teacher-1",
      students: [],
    });
  });

  it("rejeita quando a turma não existe", async () => {
    const classRepository = new InMemoryClassRepository();
    const getClassDetail = new GetClassDetail(classRepository);

    await expect(
      getClassDetail.execute("turma-inexistente", "teacher-1"),
    ).rejects.toBeInstanceOf(ClassNotFoundError);
  });

  it("nega acesso quando a turma existe mas não pertence ao professor autenticado", async () => {
    const classRepository = new InMemoryClassRepository();
    const createdClass = await classRepository.create({
      name: "Turma A",
      schoolId: "school-1",
      gradeId: "grade-1",
      teacherId: "teacher-1",
    });
    const getClassDetail = new GetClassDetail(classRepository);

    await expect(
      getClassDetail.execute(createdClass.id, "teacher-2"),
    ).rejects.toBeInstanceOf(ClassAccessDeniedError);
  });
});
