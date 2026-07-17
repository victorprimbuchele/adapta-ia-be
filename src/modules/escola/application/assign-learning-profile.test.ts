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
  prompt: { code: "P1", adaptations: ["simplified", "glossary", "tts"] },
};

const PROFILE_2: LearningProfile = {
  id: "profile-2",
  name: "Microtarefas + estrutura visual",
  prompt: { code: "P2", adaptations: ["microtasks", "visual_structure"] },
};

const PROFILE_COMPOSITE: LearningProfile = {
  id: "profile-1-3",
  name: "Simplificado + glossário + TTS + alto contraste + fonte grande + leitor de tela",
  prompt: {
    code: "P1+P3",
    kind: "composite",
    combines: ["P1", "P3"],
  },
};

async function buildScenario() {
  const studentRepository = new InMemoryStudentRepository();
  const learningProfileRepository = new InMemoryLearningProfileRepository([
    PROFILE_1,
    PROFILE_2,
    PROFILE_COMPOSITE,
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

  /**
   * Regra do Épico 3 / BE-E3.7: ao vincular um novo perfil a um aluno que
   * já tinha um, o anterior é substituído — nunca somado. Dificuldades
   * combinadas usam um perfil composto único do catálogo.
   */
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
    expect(userLearningProfileRepository.links).toEqual([
      { studentId: student.id, learningProfileId: PROFILE_2.id },
    ]);
    expect(
      await userLearningProfileRepository.findLearningProfileIdByUserId(
        student.id,
      ),
    ).toBe(PROFILE_2.id);
    expect(
      userLearningProfileRepository.links.some(
        (item) => item.learningProfileId === PROFILE_1.id,
      ),
    ).toBe(false);
  });

  it("substitui por um perfil composto sem manter o perfil simples anterior", async () => {
    const { student, assignLearningProfile, userLearningProfileRepository } =
      await buildScenario();

    await assignLearningProfile.execute({
      studentId: student.id,
      learningProfileId: PROFILE_1.id,
    });

    await assignLearningProfile.execute({
      studentId: student.id,
      learningProfileId: PROFILE_COMPOSITE.id,
    });

    expect(userLearningProfileRepository.links).toHaveLength(1);
    expect(
      await userLearningProfileRepository.findLearningProfileIdByUserId(
        student.id,
      ),
    ).toBe(PROFILE_COMPOSITE.id);
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
