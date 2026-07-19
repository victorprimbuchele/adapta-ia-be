import type { Homework } from "./homework.js";
import {
  generatorHasNoLearningProfile,
  isGeneratorHomework,
} from "./generator-homework.js";

const now = new Date();

const generator: Homework = {
  id: "hw-generator",
  title: "Geradora",
  content: "Conteúdo original",
  glossary: null,
  isDraft: true,
  homeworkId: null,
  learningProfileId: null,
  audioFileId: null,
  classId: "class-1",
  teacherId: "teacher-1",
  createdAt: now,
  updatedAt: now,
};

describe("generator-homework (BE-E4.7)", () => {
  it("identifica geradora pelo homeworkId null", () => {
    expect(isGeneratorHomework(generator)).toBe(true);
    expect(
      isGeneratorHomework({
        ...generator,
        id: "hw-variant",
        homeworkId: "hw-generator",
        learningProfileId: "profile-1",
      }),
    ).toBe(false);
  });

  it("geradora válida nunca tem learningProfileId preenchido", () => {
    expect(generatorHasNoLearningProfile(generator)).toBe(true);
    expect(
      generatorHasNoLearningProfile({
        ...generator,
        learningProfileId: "profile-1",
      }),
    ).toBe(false);
    expect(
      generatorHasNoLearningProfile({
        ...generator,
        id: "hw-variant",
        homeworkId: "hw-generator",
        learningProfileId: "profile-1",
      }),
    ).toBe(false);
  });
});
