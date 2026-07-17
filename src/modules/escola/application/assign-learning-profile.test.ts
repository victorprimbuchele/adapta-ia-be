import { AssignLearningProfile } from "./assign-learning-profile.js";
import {
  LearningProfileNotFoundError,
  StudentNotFoundError,
} from "../domain/errors.js";
import type { LearningProfile } from "../domain/learning-profile.js";
import { InMemoryLearningProfileRepository } from "./test-utils/in-memory-learning-profile-repository.js";
import { InMemoryStudentRepository } from "./test-utils/in-memory-student-repository.js";
import { InMemoryUserLearningProfileRepository } from "./test-utils/in-memory-user-learning-profile-repository.js";

const PROFILE_1: LearningProfile = {
  id: "profile-1",
  name: "Simplificado + glossário + TTS",
  prompt: { adaptations: ["simplified", "glossary", "tts"] },
};

const PROFILE_2: LearningProfile = {
  id: "profile-2",
  name: "Microtarefas + estrutura visual",
  prompt: { adaptations: ["microtasks", "visual_structure"] },
};

async function buildScenario() {
  const studentRepository = new InMemoryStudentRepository();
  const learningProfileRepository = new InMemoryLearningProfileRepository([
    PROFILE_1,
    PROFILE_2,
  ]);
  const userLearningProfileRepository =
    new InMemoryUserLearningProfileRepository();
  const assignLearningProfile = new AssignLearningProfile(
    studentRepository,
    learningProfileRepository,
    userLearningProfileRepository,
  );
  const student = await studentRepository.create({
    name: "João Souza",
    email: "joao@escola.com",
  });

  return {
    student,
    assignLearningProfile,
    userLearningProfileRepository,
  };
}

describe("AssignLearningProfile", () => {
  it("vincula um perfil de aprendizagem a um aluno sem perfil", async () => {
    const { student, assignLearningProfile, userLearningProfileRepository } =
      await buildScenario();

    const link = await assignLearningProfile.execute({
      studentId: student.id,
      learningProfileId: PROFILE_1.id,
    });

    expect(link).toEqual({
      studentId: student.id,
      learningProfileId: PROFILE_1.id,
      learningProfile: PROFILE_1,
    });
    expect(userLearningProfileRepository.links).toHaveLength(1);
    expect(
      await userLearningProfileRepository.findLearningProfileIdByUserId(
        student.id,
      ),
    ).toBe(PROFILE_1.id);
  });

  it("substitui o perfil anterior em vez de acumular múltiplos vínculos", async () => {
    const { student, assignLearningProfile, userLearningProfileRepository } =
      await buildScenario();

    await assignLearningProfile.execute({
      studentId: student.id,
      learningProfileId: PROFILE_1.id,
    });

    const link = await assignLearningProfile.execute({
      studentId: student.id,
      learningProfileId: PROFILE_2.id,
    });

    expect(link.learningProfileId).toBe(PROFILE_2.id);
    expect(userLearningProfileRepository.links).toHaveLength(1);
    expect(
      await userLearningProfileRepository.findLearningProfileIdByUserId(
        student.id,
      ),
    ).toBe(PROFILE_2.id);
  });

  it("rejeita quando o aluno não existe", async () => {
    const { assignLearningProfile } = await buildScenario();

    await expect(
      assignLearningProfile.execute({
        studentId: "aluno-inexistente",
        learningProfileId: PROFILE_1.id,
      }),
    ).rejects.toBeInstanceOf(StudentNotFoundError);
  });

  it("rejeita quando o perfil de aprendizagem não existe", async () => {
    const { student, assignLearningProfile } = await buildScenario();

    await expect(
      assignLearningProfile.execute({
        studentId: student.id,
        learningProfileId: "perfil-inexistente",
      }),
    ).rejects.toBeInstanceOf(LearningProfileNotFoundError);
  });
});
