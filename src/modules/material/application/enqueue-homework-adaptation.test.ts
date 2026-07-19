import { EnqueueHomeworkAdaptation } from "./enqueue-homework-adaptation.js";
import { LearningProfileNotFoundError } from "../../escola/domain/errors.js";
import type { LearningProfile } from "../../escola/domain/learning-profile.js";
import { InMemoryLearningProfileRepository } from "../../escola/application/test-utils/in-memory-learning-profile-repository.js";
import { InMemoryUserClassRepository } from "../../escola/application/test-utils/in-memory-user-class-repository.js";
import { InMemoryUserLearningProfileRepository } from "../../escola/application/test-utils/in-memory-user-learning-profile-repository.js";
import {
  HomeworkAccessDeniedError,
  HomeworkNotFoundError,
  HomeworkNotGeneratorError,
  NoLearningProfilesToAdaptError,
} from "../domain/errors.js";
import { InMemoryAdaptationQueue } from "./test-utils/in-memory-adaptation-queue.js";
import { InMemoryHomeworkRepository } from "./test-utils/in-memory-homework-repository.js";

const PROFILE_P1: LearningProfile = {
  id: "profile-1",
  name: "Simplificado + glossário + TTS",
  prompt: { code: "P1" },
};

const PROFILE_P2: LearningProfile = {
  id: "profile-2",
  name: "Microtarefas + estrutura visual",
  prompt: { code: "P2" },
};

async function buildScenario() {
  const homeworkRepository = new InMemoryHomeworkRepository();
  const userClassRepository = new InMemoryUserClassRepository();
  const learningProfileRepository = new InMemoryLearningProfileRepository([
    PROFILE_P1,
    PROFILE_P2,
  ]);
  const userLearningProfileRepository =
    new InMemoryUserLearningProfileRepository(learningProfileRepository);
  const adaptationQueue = new InMemoryAdaptationQueue();
  const enqueueHomeworkAdaptation = new EnqueueHomeworkAdaptation(
    homeworkRepository,
    userClassRepository,
    userLearningProfileRepository,
    learningProfileRepository,
    adaptationQueue,
  );

  const generator = await homeworkRepository.createGenerator({
    title: "Frações equivalentes",
    content: "Conteúdo da geradora",
    classId: "class-1",
    teacherId: "teacher-1",
  });

  return {
    generator,
    homeworkRepository,
    userClassRepository,
    userLearningProfileRepository,
    adaptationQueue,
    enqueueHomeworkAdaptation,
  };
}

describe("EnqueueHomeworkAdaptation", () => {
  it("enfileira um job por perfil distinto da turma e não espera o worker", async () => {
    const {
      generator,
      userClassRepository,
      userLearningProfileRepository,
      adaptationQueue,
      enqueueHomeworkAdaptation,
    } = await buildScenario();

    await userClassRepository.create("class-1", "student-1");
    await userClassRepository.create("class-1", "student-2");
    await userClassRepository.create("class-1", "student-3");
    await userLearningProfileRepository.replaceForUser(
      "student-1",
      PROFILE_P1.id,
    );
    await userLearningProfileRepository.replaceForUser(
      "student-2",
      PROFILE_P1.id,
    );
    await userLearningProfileRepository.replaceForUser(
      "student-3",
      PROFILE_P2.id,
    );

    const result = await enqueueHomeworkAdaptation.execute({
      homeworkId: generator.id,
      teacherId: "teacher-1",
    });

    expect(result).toEqual({
      homeworkId: generator.id,
      enqueuedLearningProfileIds: [PROFILE_P1.id, PROFILE_P2.id],
    });
    expect(adaptationQueue.jobs).toEqual([
      {
        homeworkId: generator.id,
        learningProfileId: PROFILE_P1.id,
        teacherId: "teacher-1",
      },
      {
        homeworkId: generator.id,
        learningProfileId: PROFILE_P2.id,
        teacherId: "teacher-1",
      },
    ]);
  });

  it("enfileira apenas os perfis selecionados quando informados", async () => {
    const { generator, adaptationQueue, enqueueHomeworkAdaptation } =
      await buildScenario();

    const result = await enqueueHomeworkAdaptation.execute({
      homeworkId: generator.id,
      teacherId: "teacher-1",
      learningProfileIds: [PROFILE_P2.id, PROFILE_P2.id],
    });

    expect(result.enqueuedLearningProfileIds).toEqual([PROFILE_P2.id]);
    expect(adaptationQueue.jobs).toEqual([
      {
        homeworkId: generator.id,
        learningProfileId: PROFILE_P2.id,
        teacherId: "teacher-1",
      },
    ]);
  });

  it("rejeita quando a homework não existe", async () => {
    const { enqueueHomeworkAdaptation, adaptationQueue } =
      await buildScenario();

    await expect(
      enqueueHomeworkAdaptation.execute({
        homeworkId: "homework-inexistente",
        teacherId: "teacher-1",
        learningProfileIds: [PROFILE_P1.id],
      }),
    ).rejects.toBeInstanceOf(HomeworkNotFoundError);
    expect(adaptationQueue.jobs).toHaveLength(0);
  });

  it("nega acesso quando a homework pertence a outro professor", async () => {
    const { generator, enqueueHomeworkAdaptation, adaptationQueue } =
      await buildScenario();

    await expect(
      enqueueHomeworkAdaptation.execute({
        homeworkId: generator.id,
        teacherId: "teacher-2",
        learningProfileIds: [PROFILE_P1.id],
      }),
    ).rejects.toBeInstanceOf(HomeworkAccessDeniedError);
    expect(adaptationQueue.jobs).toHaveLength(0);
  });

  it("rejeita quando a homework não é geradora", async () => {
    const {
      generator,
      homeworkRepository,
      enqueueHomeworkAdaptation,
      adaptationQueue,
    } = await buildScenario();

    const now = new Date();
    homeworkRepository.homeworks.push({
      id: "adaptation-1",
      title: "Variante",
      content: "Conteúdo adaptado",
      isDraft: false,
      homeworkId: generator.id,
      learningProfileId: PROFILE_P1.id,
      classId: "class-1",
      teacherId: "teacher-1",
      createdAt: now,
      updatedAt: now,
    });

    await expect(
      enqueueHomeworkAdaptation.execute({
        homeworkId: "adaptation-1",
        teacherId: "teacher-1",
        learningProfileIds: [PROFILE_P2.id],
      }),
    ).rejects.toBeInstanceOf(HomeworkNotGeneratorError);
    expect(adaptationQueue.jobs).toHaveLength(0);
  });

  it("rejeita quando a turma não tem perfis e nenhum perfil foi selecionado", async () => {
    const { generator, enqueueHomeworkAdaptation, adaptationQueue } =
      await buildScenario();

    await expect(
      enqueueHomeworkAdaptation.execute({
        homeworkId: generator.id,
        teacherId: "teacher-1",
      }),
    ).rejects.toBeInstanceOf(NoLearningProfilesToAdaptError);
    expect(adaptationQueue.jobs).toHaveLength(0);
  });

  it("rejeita perfil selecionado inexistente", async () => {
    const { generator, enqueueHomeworkAdaptation, adaptationQueue } =
      await buildScenario();

    await expect(
      enqueueHomeworkAdaptation.execute({
        homeworkId: generator.id,
        teacherId: "teacher-1",
        learningProfileIds: ["perfil-inexistente"],
      }),
    ).rejects.toBeInstanceOf(LearningProfileNotFoundError);
    expect(adaptationQueue.jobs).toHaveLength(0);
  });
});
