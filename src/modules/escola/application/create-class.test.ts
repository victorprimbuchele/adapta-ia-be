import { CreateClass } from "./create-class.js";
import { GradeNotFoundError, SchoolNotFoundError } from "../domain/errors.js";
import { InMemoryClassRepository } from "./test-utils/in-memory-class-repository.js";
import { InMemoryGradeRepository } from "./test-utils/in-memory-grade-repository.js";
import { InMemorySchoolRepository } from "./test-utils/in-memory-school-repository.js";

function buildRepositories() {
  const now = new Date();
  const schoolRepository = new InMemorySchoolRepository([
    {
      id: "school-1",
      name: "Escola Municipal João de Barro",
      city: "São Paulo",
      state: "SP",
      createdAt: now,
      updatedAt: now,
    },
  ]);
  const gradeRepository = new InMemoryGradeRepository([
    {
      id: "grade-1",
      name: "1º Ano",
      sortOrder: 1,
      createdAt: now,
      updatedAt: now,
    },
  ]);
  const classRepository = new InMemoryClassRepository();

  return { schoolRepository, gradeRepository, classRepository };
}

describe("CreateClass", () => {
  it("cria a turma com o professor responsável definido como o usuário autenticado", async () => {
    const { schoolRepository, gradeRepository, classRepository } =
      buildRepositories();
    const createClass = new CreateClass(
      classRepository,
      schoolRepository,
      gradeRepository,
    );

    const createdClass = await createClass.execute({
      name: "Turma A",
      schoolId: "school-1",
      gradeId: "grade-1",
      teacherId: "teacher-1",
    });

    expect(createdClass).toMatchObject({
      name: "Turma A",
      schoolId: "school-1",
      gradeId: "grade-1",
      teacherId: "teacher-1",
    });
    expect(classRepository.classes).toHaveLength(1);
  });

  it("rejeita a criação quando a escola informada não existe", async () => {
    const { schoolRepository, gradeRepository, classRepository } =
      buildRepositories();
    const createClass = new CreateClass(
      classRepository,
      schoolRepository,
      gradeRepository,
    );

    await expect(
      createClass.execute({
        name: "Turma A",
        schoolId: "school-inexistente",
        gradeId: "grade-1",
        teacherId: "teacher-1",
      }),
    ).rejects.toBeInstanceOf(SchoolNotFoundError);
    expect(classRepository.classes).toHaveLength(0);
  });

  it("rejeita a criação quando a série informada não existe", async () => {
    const { schoolRepository, gradeRepository, classRepository } =
      buildRepositories();
    const createClass = new CreateClass(
      classRepository,
      schoolRepository,
      gradeRepository,
    );

    await expect(
      createClass.execute({
        name: "Turma A",
        schoolId: "school-1",
        gradeId: "grade-inexistente",
        teacherId: "teacher-1",
      }),
    ).rejects.toBeInstanceOf(GradeNotFoundError);
    expect(classRepository.classes).toHaveLength(0);
  });
});
