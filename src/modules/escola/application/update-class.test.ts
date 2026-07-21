import { UpdateClass } from "./update-class.js";
import { GradeNotFoundError, ClassAccessDeniedError } from "../domain/errors.js";
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
    {
      id: "grade-2",
      name: "2º Ano",
      sortOrder: 2,
      createdAt: now,
      updatedAt: now,
    },
  ]);
  const classRepository = new InMemoryClassRepository();

  return {
    schoolRepository,
    gradeRepository,
    classRepository,
  };
}

describe("UpdateClass", () => {
  it("atualiza nome, escola e série de uma turma existente do professor", async () => {
    const { schoolRepository, gradeRepository, classRepository } = buildRepositories();
    const created = await classRepository.create({
      name: "Turma Antiga",
      schoolId: "school-1",
      gradeId: "grade-1",
      teacherId: "teacher-1",
    });

    const updateClass = new UpdateClass(classRepository, schoolRepository, gradeRepository);

    const updated = await updateClass.execute({
      classId: created.id,
      teacherId: "teacher-1",
      name: "Turma Nova",
      schoolName: "Escola Municipal João de Barro",
      gradeId: "grade-2",
    });

    expect(updated).toMatchObject({
      id: created.id,
      name: "Turma Nova",
      schoolId: "school-1",
      gradeId: "grade-2",
    });
  });

  it("cria uma nova escola quando o nome da escola atualizada não existe no banco", async () => {
    const { schoolRepository, gradeRepository, classRepository } = buildRepositories();
    const created = await classRepository.create({
      name: "Turma A",
      schoolId: "school-1",
      gradeId: "grade-1",
      teacherId: "teacher-1",
    });

    const updateClass = new UpdateClass(classRepository, schoolRepository, gradeRepository);

    const updated = await updateClass.execute({
      classId: created.id,
      teacherId: "teacher-1",
      name: "Turma A",
      schoolName: "Escola Nova",
      gradeId: "grade-1",
    });

    const newSchool = await schoolRepository.findByName("Escola Nova");
    expect(newSchool).not.toBeNull();
    expect(updated.schoolId).toBe(newSchool!.id);
  });

  it("rejeita a atualização quando a série informada não existe", async () => {
    const { schoolRepository, gradeRepository, classRepository } = buildRepositories();
    const created = await classRepository.create({
      name: "Turma A",
      schoolId: "school-1",
      gradeId: "grade-1",
      teacherId: "teacher-1",
    });

    const updateClass = new UpdateClass(classRepository, schoolRepository, gradeRepository);

    await expect(
      updateClass.execute({
        classId: created.id,
        teacherId: "teacher-1",
        name: "Turma A",
        schoolName: "Escola Municipal João de Barro",
        gradeId: "grade-inexistente",
      }),
    ).rejects.toBeInstanceOf(GradeNotFoundError);
  });

  it("rejeita a atualização se o professor não for o dono da turma", async () => {
    const { schoolRepository, gradeRepository, classRepository } = buildRepositories();
    const created = await classRepository.create({
      name: "Turma A",
      schoolId: "school-1",
      gradeId: "grade-1",
      teacherId: "teacher-1",
    });

    const updateClass = new UpdateClass(classRepository, schoolRepository, gradeRepository);

    await expect(
      updateClass.execute({
        classId: created.id,
        teacherId: "outroporfessor-id",
        name: "Turma A",
        schoolName: "Escola Municipal João de Barro",
        gradeId: "grade-1",
      }),
    ).rejects.toBeInstanceOf(ClassAccessDeniedError);
  });
});
