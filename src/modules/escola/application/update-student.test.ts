import { UpdateStudent } from "./update-student.js";
import {
  ClassAccessDeniedError,
  ClassNotFoundError,
  LearningProfileNotFoundError,
  StudentAlreadyEnrolledError,
  StudentNotEnrolledError,
} from "../domain/errors.js";
import { InMemoryClassRepository } from "./test-utils/in-memory-class-repository.js";
import { InMemoryLearningProfileRepository } from "./test-utils/in-memory-learning-profile-repository.js";
import { InMemoryStudentRepository } from "./test-utils/in-memory-student-repository.js";
import { InMemoryUserClassRepository } from "./test-utils/in-memory-user-class-repository.js";
import { InMemoryUserLearningProfileRepository } from "./test-utils/in-memory-user-learning-profile-repository.js";

async function buildScenario() {
  const classRepository = new InMemoryClassRepository();
  const studentRepository = new InMemoryStudentRepository();
  const userClassRepository = new InMemoryUserClassRepository();
  const learningProfileRepository = new InMemoryLearningProfileRepository([
    {
      id: "profile-1",
      name: "TDAH",
      prompt: { id: "prompt-1", code: "P1", name: "TDAH", systemPrompt: "..." },
    },
  ]);
  const userLearningProfileRepository = new InMemoryUserLearningProfileRepository(learningProfileRepository);

  const updateStudent = new UpdateStudent(
    classRepository,
    userClassRepository,
    studentRepository,
    learningProfileRepository,
    userLearningProfileRepository,
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

  return {
    classRepository,
    studentRepository,
    userClassRepository,
    learningProfileRepository,
    userLearningProfileRepository,
    updateStudent,
    createdClass,
    student,
  };
}

describe("UpdateStudent", () => {
  it("atualiza nome e e-mail de um aluno matriculado na turma", async () => {
    const { updateStudent, createdClass, student } = await buildScenario();

    const updated = await updateStudent.execute({
      classId: createdClass.id,
      teacherId: "teacher-1",
      studentId: student.id,
      name: "João Pedro Souza",
      email: "joao.pedro@escola.com",
    });

    expect(updated).toMatchObject({
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

  it("atualiza também o perfil de aprendizagem se informado", async () => {
    const { updateStudent, createdClass, student, userLearningProfileRepository } = await buildScenario();

    await updateStudent.execute({
      classId: createdClass.id,
      teacherId: "teacher-1",
      studentId: student.id,
      name: "Novo Nome",
      email: "novo@escola.com",
      learningProfileId: "profile-1",
    });

    const activeProfileId = await userLearningProfileRepository.findLearningProfileIdByUserId(student.id);
    expect(activeProfileId).toBe("profile-1");
  });

  it("rejeita a atualização se o perfil de aprendizagem informado não existir", async () => {
    const { updateStudent, createdClass, student } = await buildScenario();

    await expect(
      updateStudent.execute({
        classId: createdClass.id,
        teacherId: "teacher-1",
        studentId: student.id,
        name: "Alterado",
        email: "alterado@escola.com",
        learningProfileId: "profile-inexistente",
      }),
    ).rejects.toBeInstanceOf(LearningProfileNotFoundError);
  });

  it("rejeita se o e-mail já pertence a outro aluno matriculado NESTA turma", async () => {
    const { updateStudent, createdClass, studentRepository, userClassRepository, student } =
      await buildScenario();
    const outroAlunoMesmaTurma = await studentRepository.create({
      name: "Outro Aluno",
      email: "outro@escola.com",
    });
    await userClassRepository.create(createdClass.id, outroAlunoMesmaTurma.id);

    await expect(
      updateStudent.execute({
        classId: createdClass.id,
        teacherId: "teacher-1",
        studentId: student.id,
        name: "Alterado",
        email: "outro@escola.com",
      }),
    ).rejects.toBeInstanceOf(StudentAlreadyEnrolledError);
  });

  it("reaproveita o cadastro se o e-mail já pertence a um aluno matriculado em OUTRA turma", async () => {
    const { updateStudent, classRepository, createdClass, studentRepository, userClassRepository, student } =
      await buildScenario();
    const outraTurma = await classRepository.create({
      name: "Turma B",
      schoolId: "school-1",
      gradeId: "grade-1",
      teacherId: "teacher-1",
    });
    const alunoDeOutraTurma = await studentRepository.create({
      name: "Aluno Compartilhado",
      email: "compartilhado@escola.com",
    });
    await userClassRepository.create(outraTurma.id, alunoDeOutraTurma.id);

    const updated = await updateStudent.execute({
      classId: createdClass.id,
      teacherId: "teacher-1",
      studentId: student.id,
      name: "Nome Ignorado",
      email: "compartilhado@escola.com",
    });

    expect(updated.id).toBe(alunoDeOutraTurma.id);
    expect(await userClassRepository.exists(createdClass.id, alunoDeOutraTurma.id)).toBe(true);
    expect(await userClassRepository.exists(createdClass.id, student.id)).toBe(false);
    expect(await userClassRepository.exists(outraTurma.id, alunoDeOutraTurma.id)).toBe(true);
  });

  it("rejeita a atualização se o aluno não estiver matriculado na turma", async () => {
    const { updateStudent, createdClass, studentRepository } = await buildScenario();
    const otherStudent = await studentRepository.create({
      name: "Outro Aluno",
      email: "outro-nao-vinculado@escola.com",
    });

    await expect(
      updateStudent.execute({
        classId: createdClass.id,
        teacherId: "teacher-1",
        studentId: otherStudent.id,
        name: "Alterado",
        email: "alterado@escola.com",
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

  it("rejeita a atualização se o professor não for o dono da turma", async () => {
    const { updateStudent, createdClass, student } = await buildScenario();

    await expect(
      updateStudent.execute({
        classId: createdClass.id,
        teacherId: "teacher-2",
        studentId: student.id,
        name: "Alterado",
        email: "alterado@escola.com",
      }),
    ).rejects.toBeInstanceOf(ClassAccessDeniedError);
  });
});
