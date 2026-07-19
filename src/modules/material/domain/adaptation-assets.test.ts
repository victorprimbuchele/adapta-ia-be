import type { Homework } from "./homework.js";
import {
  generatorHasNoAdaptationAssets,
  hasAdaptationAssets,
  isGeneratorHomework,
} from "./adaptation-assets.js";

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

const variantWithAssets: Homework = {
  ...generator,
  id: "hw-variant",
  isDraft: false,
  homeworkId: "hw-generator",
  learningProfileId: "profile-1",
  glossary: [{ term: "fração", definition: "parte de um todo" }],
  audioFileId: "file-audio-1",
};

describe("adaptation-assets (BE-E5.11)", () => {
  it("identifica geradora vs variante", () => {
    expect(isGeneratorHomework(generator)).toBe(true);
    expect(isGeneratorHomework(variantWithAssets)).toBe(false);
  });

  it("detecta assets de adaptação (glossário/áudio)", () => {
    expect(hasAdaptationAssets(generator)).toBe(false);
    expect(hasAdaptationAssets(variantWithAssets)).toBe(true);
    expect(
      hasAdaptationAssets({ ...generator, glossary: [] }),
    ).toBe(true);
    expect(
      hasAdaptationAssets({ ...generator, audioFileId: "file-1" }),
    ).toBe(true);
  });

  it("geradora válida nunca tem glossário nem áudio", () => {
    expect(generatorHasNoAdaptationAssets(generator)).toBe(true);
    expect(
      generatorHasNoAdaptationAssets({
        ...generator,
        glossary: [{ term: "x", definition: "y" }],
      }),
    ).toBe(false);
    expect(
      generatorHasNoAdaptationAssets({
        ...generator,
        audioFileId: "file-1",
      }),
    ).toBe(false);
    expect(generatorHasNoAdaptationAssets(variantWithAssets)).toBe(false);
  });
});
