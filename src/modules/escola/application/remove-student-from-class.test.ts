import { RemoveStudentFromClass } from "./remove-student-from-class.js";
import {
  ClassAccessDeniedError,
  ClassNotFoundError,
  StudentNotEnrolledError,
} from "../domain/errors.js";
import { InMemoryClassRepository } from "./test-utils/in-memory-class-repository.js";
import { InMemoryStudentRepository } from "./test-utils/in-memory-student-repository.js";
import { InMemoryUserClassRepository } from "./test-utils/in-memory-user-class-repository.js";

async function buildScenario() {
  const classRepository = new InMemoryClassRepository();
  const studentRepository = new InMemoryStudentRepository();
  const userClassRepository = new InMemoryUserClassRepository();
  const removeStudentFromClass = new RemoveStudentFromClass(
    classRepository,
    userClassRepository,
  );
  const createdClass = await classRepository.create({
    name: "Turma A",
    schoolId: "school-1",
    gradeId: "grade-1",
    teacherId: "teacher-1",
  });
  const student = await studentRepository.create({
    name: "João Souza",
    email: "joao@escola.com",
  });

  return {
    createdClass,
    student,
    removeStudentFromClass,
    userClassRepository,
  };
}

describe("RemoveStudentFromClass", () => {
  it("remove o aluno da turma", async () => {
    const {
      createdClass,
      student,
      removeStudentFromClass,
      userClassRepository,
    } = await buildScenario();
    await userClassRepository.create(createdClass.id, student.id);

    await removeStudentFromClass.execute({
      classId: createdClass.id,
      teacherId: "teacher-1",
      studentId: student.id,
    });

    expect(
      await userClassRepository.exists(createdClass.id, student.id),
    ).toBe(false);
    expect(
      await userClassRepository.listStudentIdsByClassId(createdClass.id),
    ).toEqual([]);
  });

  it("rejeita quando o aluno não está vinculado à turma", async () => {
    const { createdClass, student, removeStudentFromClass } =
      await buildScenario();

    await expect(
      removeStudentFromClass.execute({
        classId: createdClass.id,
        teacherId: "teacher-1",
        studentId: student.id,
      }),
    ).rejects.toBeInstanceOf(StudentNotEnrolledError);
  });

  it("rejeita quando a turma não existe", async () => {
    const { student, removeStudentFromClass } = await buildScenario();

    await expect(
      removeStudentFromClass.execute({
        classId: "turma-inexistente",
        teacherId: "teacher-1",
        studentId: student.id,
      }),
    ).rejects.toBeInstanceOf(ClassNotFoundError);
  });

  it("nega remoção quando a turma pertence a outro professor", async () => {
    const { createdClass, student, removeStudentFromClass, userClassRepository } =
      await buildScenario();
    await userClassRepository.create(createdClass.id, student.id);

    await expect(
      removeStudentFromClass.execute({
        classId: createdClass.id,
        teacherId: "teacher-2",
        studentId: student.id,
      }),
    ).rejects.toBeInstanceOf(ClassAccessDeniedError);
  });
});
