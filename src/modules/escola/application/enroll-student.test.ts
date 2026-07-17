import { EnrollStudent } from "./enroll-student.js";
import {
  ClassAccessDeniedError,
  ClassNotFoundError,
  StudentAlreadyEnrolledError,
} from "../domain/errors.js";
import { InMemoryClassRepository } from "./test-utils/in-memory-class-repository.js";
import { InMemoryStudentRepository } from "./test-utils/in-memory-student-repository.js";
import { InMemoryUserClassRepository } from "./test-utils/in-memory-user-class-repository.js";

async function buildScenario() {
  const classRepository = new InMemoryClassRepository();
  const studentRepository = new InMemoryStudentRepository();
  const userClassRepository = new InMemoryUserClassRepository();
  const enrollStudent = new EnrollStudent(
    classRepository,
    studentRepository,
    userClassRepository,
  );
  const createdClass = await classRepository.create({
    name: "Turma A",
    schoolId: "school-1",
    gradeId: "grade-1",
    teacherId: "teacher-1",
  });

  return {
    classRepository,
    studentRepository,
    userClassRepository,
    enrollStudent,
    createdClass,
  };
}

describe("EnrollStudent", () => {
  it("cadastra um novo aluno e o vincula à turma do professor autenticado", async () => {
    const { enrollStudent, createdClass, studentRepository, userClassRepository } =
      await buildScenario();

    const student = await enrollStudent.execute({
      classId: createdClass.id,
      teacherId: "teacher-1",
      name: "João Souza",
      email: "joao@escola.com",
    });

    expect(student).toMatchObject({
      name: "João Souza",
      email: "joao@escola.com",
    });
    expect(studentRepository.students).toHaveLength(1);
    expect(
      await userClassRepository.exists(createdClass.id, student.id),
    ).toBe(true);
  });

  it("reaproveita o aluno já cadastrado (mesmo e-mail) em vez de duplicá-lo", async () => {
    const { enrollStudent, createdClass, studentRepository } =
      await buildScenario();
    const existingStudent = await studentRepository.create({
      name: "João Souza",
      email: "joao@escola.com",
    });

    const student = await enrollStudent.execute({
      classId: createdClass.id,
      teacherId: "teacher-1",
      name: "João Souza",
      email: "joao@escola.com",
    });

    expect(student.id).toBe(existingStudent.id);
    expect(studentRepository.students).toHaveLength(1);
  });

  it("rejeita quando a turma não existe", async () => {
    const { enrollStudent } = await buildScenario();

    await expect(
      enrollStudent.execute({
        classId: "turma-inexistente",
        teacherId: "teacher-1",
        name: "João Souza",
        email: "joao@escola.com",
      }),
    ).rejects.toBeInstanceOf(ClassNotFoundError);
  });

  it("nega vinculação quando a turma pertence a outro professor", async () => {
    const { enrollStudent, createdClass } = await buildScenario();

    await expect(
      enrollStudent.execute({
        classId: createdClass.id,
        teacherId: "teacher-2",
        name: "João Souza",
        email: "joao@escola.com",
      }),
    ).rejects.toBeInstanceOf(ClassAccessDeniedError);
  });

  it("rejeita vincular o mesmo aluno duas vezes à mesma turma", async () => {
    const { enrollStudent, createdClass } = await buildScenario();
    await enrollStudent.execute({
      classId: createdClass.id,
      teacherId: "teacher-1",
      name: "João Souza",
      email: "joao@escola.com",
    });

    await expect(
      enrollStudent.execute({
        classId: createdClass.id,
        teacherId: "teacher-1",
        name: "João Souza",
        email: "joao@escola.com",
      }),
    ).rejects.toBeInstanceOf(StudentAlreadyEnrolledError);
  });
});
