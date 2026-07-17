import { ListClassStudents } from "./list-class-students.js";
import {
  ClassAccessDeniedError,
  ClassNotFoundError,
} from "../domain/errors.js";
import type { LearningProfile } from "../domain/learning-profile.js";
import { InMemoryClassRepository } from "./test-utils/in-memory-class-repository.js";
import { InMemoryLearningProfileRepository } from "./test-utils/in-memory-learning-profile-repository.js";
import { InMemoryStudentRepository } from "./test-utils/in-memory-student-repository.js";
import { InMemoryUserClassRepository } from "./test-utils/in-memory-user-class-repository.js";
import { InMemoryUserLearningProfileRepository } from "./test-utils/in-memory-user-learning-profile-repository.js";

const PROFILE: LearningProfile = {
  id: "profile-1",
  name: "Simplificado + glossário + TTS",
  prompt: { adaptations: ["simplified", "glossary", "tts"] },
};

async function buildScenario() {
  const classRepository = new InMemoryClassRepository();
  const studentRepository = new InMemoryStudentRepository();
  const userClassRepository = new InMemoryUserClassRepository();
  const learningProfileRepository = new InMemoryLearningProfileRepository([
    PROFILE,
  ]);
  const userLearningProfileRepository =
    new InMemoryUserLearningProfileRepository(learningProfileRepository);
  const listClassStudents = new ListClassStudents(
    classRepository,
    userClassRepository,
    studentRepository,
    userLearningProfileRepository,
  );
  const createdClass = await classRepository.create({
    name: "Turma A",
    schoolId: "school-1",
    gradeId: "grade-1",
    teacherId: "teacher-1",
  });

  return {
    createdClass,
    listClassStudents,
    studentRepository,
    userClassRepository,
    userLearningProfileRepository,
  };
}

describe("ListClassStudents", () => {
  it("retorna lista vazia quando a turma não tem alunos", async () => {
    const { createdClass, listClassStudents } = await buildScenario();

    const students = await listClassStudents.execute(
      createdClass.id,
      "teacher-1",
    );

    expect(students).toEqual([]);
  });

  it("lista alunos com perfil vinculado ou null", async () => {
    const {
      createdClass,
      listClassStudents,
      studentRepository,
      userClassRepository,
      userLearningProfileRepository,
    } = await buildScenario();

    const withProfile = await studentRepository.create({
      name: "João Souza",
      email: "joao@escola.com",
    });
    const withoutProfile = await studentRepository.create({
      name: "Maria Silva",
      email: "maria@escola.com",
    });
    await userClassRepository.create(createdClass.id, withProfile.id);
    await userClassRepository.create(createdClass.id, withoutProfile.id);
    await userLearningProfileRepository.replaceForUser(
      withProfile.id,
      PROFILE.id,
    );

    const students = await listClassStudents.execute(
      createdClass.id,
      "teacher-1",
    );

    expect(students).toEqual([
      {
        id: withProfile.id,
        name: "João Souza",
        email: "joao@escola.com",
        learningProfile: PROFILE,
      },
      {
        id: withoutProfile.id,
        name: "Maria Silva",
        email: "maria@escola.com",
        learningProfile: null,
      },
    ]);
  });

  it("rejeita quando a turma não existe", async () => {
    const { listClassStudents } = await buildScenario();

    await expect(
      listClassStudents.execute("turma-inexistente", "teacher-1"),
    ).rejects.toBeInstanceOf(ClassNotFoundError);
  });

  it("nega acesso quando a turma pertence a outro professor", async () => {
    const { createdClass, listClassStudents } = await buildScenario();

    await expect(
      listClassStudents.execute(createdClass.id, "teacher-2"),
    ).rejects.toBeInstanceOf(ClassAccessDeniedError);
  });
});
