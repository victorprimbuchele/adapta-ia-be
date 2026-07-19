import type { LearningProfile } from "../../escola/domain/learning-profile.js";
import { InMemoryClassRepository } from "../../escola/application/test-utils/in-memory-class-repository.js";
import { InMemoryLearningProfileRepository } from "../../escola/application/test-utils/in-memory-learning-profile-repository.js";
import {
  generatorHasNoLearningProfile,
  isGeneratorHomework,
} from "../domain/generator-homework.js";
import { CreateGeneratorHomework } from "./create-generator-homework.js";
import { GetHomeworkDetail } from "./get-homework-detail.js";
import { ListClassHomeworks } from "./list-class-homeworks.js";
import { ProcessHomeworkAdaptation } from "./process-homework-adaptation.js";
import { UpdateDraftHomework } from "./update-draft-homework.js";
import { InMemoryAudioGenerator } from "./test-utils/in-memory-audio-generator.js";
import { InMemoryFileRepository } from "./test-utils/in-memory-file-repository.js";
import { InMemoryHomeworkRepository } from "./test-utils/in-memory-homework-repository.js";
import { InMemoryObjectStorage } from "./test-utils/in-memory-object-storage.js";
import { InMemoryTeacherRepository } from "./test-utils/in-memory-teacher-repository.js";
import { InMemoryTextSimplifier } from "./test-utils/in-memory-text-simplifier.js";

/**
 * BE-E4.7 — atividade geradora nunca tem `learning_profile_id` preenchido.
 */
describe("invariante: geradora sem learning_profile_id (BE-E4.7)", () => {
  const PROFILE: LearningProfile = {
    id: "profile-1",
    name: "Simplificado + glossário + TTS",
    prompt: {
      code: "P1",
      kind: "base",
      combines: ["P1"],
      adaptations: {
        simplifyText: true,
        glossary: true,
        tts: true,
        microtasks: false,
        visualStructure: false,
        highContrast: false,
        largeFont: false,
        screenReader: false,
      },
      instructions: "Simplifique.",
    },
  };

  it("criação da geradora deixa learningProfileId null", async () => {
    const homeworkRepository = new InMemoryHomeworkRepository();
    const teacherRepository = new InMemoryTeacherRepository([
      { id: "teacher-1" },
    ]);
    const classRepository = new InMemoryClassRepository();
    const createdClass = await classRepository.create({
      name: "Turma A",
      schoolId: "school-1",
      gradeId: "grade-1",
      teacherId: "teacher-1",
    });
    const createGeneratorHomework = new CreateGeneratorHomework(
      homeworkRepository,
      teacherRepository,
      classRepository,
    );

    const homework = await createGeneratorHomework.execute({
      title: "Interpretação de texto",
      content: "Leia o texto e responda.",
      classId: createdClass.id,
      teacherId: "teacher-1",
    });

    expect(isGeneratorHomework(homework)).toBe(true);
    expect(generatorHasNoLearningProfile(homework)).toBe(true);
    expect(homework.learningProfileId).toBeNull();
  });

  it("editar rascunho não preenche learningProfileId na geradora", async () => {
    const homeworkRepository = new InMemoryHomeworkRepository();
    const draft = await homeworkRepository.createGenerator({
      title: "Original",
      content: "Conteúdo",
      classId: "class-1",
      teacherId: "teacher-1",
    });
    const updateDraftHomework = new UpdateDraftHomework(homeworkRepository);

    const updated = await updateDraftHomework.execute({
      homeworkId: draft.id,
      teacherId: "teacher-1",
      title: "Atualizado",
      content: "Conteúdo atualizado",
    });

    expect(generatorHasNoLearningProfile(updated)).toBe(true);
    expect(updated.learningProfileId).toBeNull();
  });

  it("após adaptação, learningProfileId fica só na variante", async () => {
    const homeworkRepository = new InMemoryHomeworkRepository();
    const learningProfileRepository = new InMemoryLearningProfileRepository([
      PROFILE,
    ]);
    const processHomeworkAdaptation = new ProcessHomeworkAdaptation(
      homeworkRepository,
      learningProfileRepository,
      new InMemoryTextSimplifier(),
      new InMemoryAudioGenerator(),
      new InMemoryObjectStorage(),
      new InMemoryFileRepository(),
    );

    const generator = await homeworkRepository.createGenerator({
      title: "Frações",
      content: "Conteúdo da geradora",
      classId: "class-1",
      teacherId: "teacher-1",
    });

    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    const { homework: variant } = await processHomeworkAdaptation.execute({
      homeworkId: generator.id,
      learningProfileId: PROFILE.id,
      teacherId: "teacher-1",
    });
    logSpy.mockRestore();

    const generatorAfter = await homeworkRepository.findById(generator.id);
    expect(generatorAfter).not.toBeNull();
    expect(generatorHasNoLearningProfile(generatorAfter!)).toBe(true);
    expect(generatorAfter!.learningProfileId).toBeNull();

    expect(isGeneratorHomework(variant)).toBe(false);
    expect(variant.learningProfileId).toBe(PROFILE.id);
  });

  it("listagem e detalhe da geradora mantêm learningProfileId null", async () => {
    const homeworkRepository = new InMemoryHomeworkRepository();
    const classRepository = new InMemoryClassRepository();
    const createdClass = await classRepository.create({
      name: "Turma A",
      schoolId: "school-1",
      gradeId: "grade-1",
      teacherId: "teacher-1",
    });

    const generator = await homeworkRepository.createGenerator({
      title: "Atividade",
      content: "Conteúdo",
      classId: createdClass.id,
      teacherId: "teacher-1",
    });

    await homeworkRepository.upsertAdaptation({
      title: "Variante",
      content: "Adaptada",
      glossary: null,
      homeworkId: generator.id,
      learningProfileId: PROFILE.id,
      classId: createdClass.id,
      teacherId: "teacher-1",
    });

    const listClassHomeworks = new ListClassHomeworks(
      classRepository,
      homeworkRepository,
    );
    const listed = await listClassHomeworks.execute(
      createdClass.id,
      "teacher-1",
    );

    expect(listed).toHaveLength(1);
    expect(generatorHasNoLearningProfile(listed[0]!)).toBe(true);
    expect(listed[0]!.learningProfileId).toBeNull();

    const detail = await new GetHomeworkDetail(homeworkRepository).execute(
      generator.id,
      "teacher-1",
    );

    expect(generatorHasNoLearningProfile(detail)).toBe(true);
    expect(detail.learningProfileId).toBeNull();
    expect(detail.adaptations[0]?.learningProfileId).toBe(PROFILE.id);
  });
});
