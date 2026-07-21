import { UpdateStudent } from "./update-student.js";
import {
  ClassAccessDeniedError,
  ClassNotFoundError,
  StudentEmailAlreadyInUseError,
  StudentNotEnrolledError,
} from "../domain/errors.js";
import { InMemoryClassRepository } from "./test-utils/in-memory-class-repository.js";
import { InMemoryStudentRepository } from "./test-utils/in-memory-student-repository.js";
import { InMemoryUserClassRepository } from "./test-utils/in-memory-user-class-repository.js";

async function buildScenario() {
  const classRepository = new InMemoryClassRepository();
  const studentRepository = new InMemoryStudentRepository();
  const userClassRepository = new InMemoryUserClassRepository();
  const updateStudent = new UpdateStudent(
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
  const student = await studentRepository.create({
    name: "João Souza",
    email: "joao@escola.com",
  });
  await userClassRepository.create(createdClass.id, student.id);

  return { createdClass, student, updateStudent, studentRepository, userClassRepository };
}

describe("UpdateStudent", () => {
  it("atualiza nome e e-mail do aluno vinculado à turma", async () => {
    const { createdClass, student, updateStudent } = await buildScenario();

    const updated = await updateStudent.execute({
      classId: createdClass.id,
      teacherId: "teacher-1",
      studentId: student.id,
      name: "João Pedro Souza",
      email: "joao.pedro@escola.com",
    });

    expect(updated).toEqual({
      id: student.id,
      name: "João Pedro Souza",
      email: "joao.pedro@escola.com",
    });
  });

  it("permite manter o mesmo e-mail (sem colidir consigo mesmo)", async () => {
    const { createdClass, student, updateStudent } = await buildScenario();

    const updated = await updateStudent.execute({
      classId: createdClass.id,
      teacherId: "teacher-1",
      studentId: student.id,
      name: "João Souza",
      email: "joao@escola.com",
    });

    expect(updated.email).toBe("joao@escola.com");
  });

  it("rejeita quando o novo e-mail já pertence a outro usuário", async () => {
    const { createdClass, student, updateStudent, studentRepository } = await buildScenario();
    await studentRepository.create({ name: "Outra Aluna", email: "outra@escola.com" });

    await expect(
      updateStudent.execute({
        classId: createdClass.id,
        teacherId: "teacher-1",
        studentId: student.id,
        name: "João Souza",
        email: "outra@escola.com",
      }),
    ).rejects.toBeInstanceOf(StudentEmailAlreadyInUseError);
  });

  it("rejeita quando o aluno não está vinculado à turma", async () => {
    const { createdClass, updateStudent, studentRepository } = await buildScenario();
    const outroAluno = await studentRepository.create({
      name: "Não Vinculado",
      email: "nao-vinculado@escola.com",
    });

    await expect(
      updateStudent.execute({
        classId: createdClass.id,
        teacherId: "teacher-1",
        studentId: outroAluno.id,
        name: "Não Vinculado",
        email: "nao-vinculado@escola.com",
      }),
    ).rejects.toBeInstanceOf(StudentNotEnrolledError);
  });

  it("rejeita quando a turma não existe", async () => {
    const { student, updateStudent } = await buildScenario();

    await expect(
      updateStudent.execute({
        classId: "turma-inexistente",
        teacherId: "teacher-1",
        studentId: student.id,
        name: student.name,
        email: student.email,
      }),
    ).rejects.toBeInstanceOf(ClassNotFoundError);
  });

  it("nega edição quando a turma pertence a outro professor", async () => {
    const { createdClass, student, updateStudent } = await buildScenario();

    await expect(
      updateStudent.execute({
        classId: createdClass.id,
        teacherId: "teacher-2",
        studentId: student.id,
        name: student.name,
        email: student.email,
      }),
    ).rejects.toBeInstanceOf(ClassAccessDeniedError);
  });
});
