import { Prisma, type PrismaClient } from "../../../../generated/prisma/client.js";
import type { GlossaryEntry } from "../../domain/glossary.js";
import { glossarySchema } from "../../domain/glossary.js";
import type { Homework } from "../../domain/homework.js";
import type {
  CreateGeneratorHomeworkData,
  HomeworkRepository,
  UpdateDraftHomeworkData,
  UpsertAdaptationHomeworkData,
} from "../../ports/homework-repository.js";

type HomeworkRow = {
  id: string;
  title: string;
  content: string;
  subject: string | null;
  question: string | null;
  glossary: Prisma.JsonValue | null;
  isDraft: boolean;
  homeworkId: string | null;
  learningProfileId: string | null;
  audioFileId: string | null;
  classId: string;
  teacherId: string;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Implementação de `HomeworkRepository` sobre a tabela `homeworks`
 * (Épico 4; variantes — Épico 5, BE-E5.5 / BE-E5.7).
 */
export class PrismaHomeworkRepository implements HomeworkRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async createGenerator(data: CreateGeneratorHomeworkData): Promise<Homework> {
    const row = await this.prisma.homework.create({
      data: {
        title: data.title,
        content: data.content,
        subject: data.subject ?? null,
        question: data.question ?? null,
        classId: data.classId,
        teacherId: data.teacherId,
        isDraft: true,
        homeworkId: null,
        learningProfileId: null,
        audioFileId: null,
        glossary: Prisma.DbNull,
      },
    });

    return toDomain(row);
  }

  async findById(id: string): Promise<Homework | null> {
    const row = await this.prisma.homework.findUnique({ where: { id } });
    return row ? toDomain(row) : null;
  }

  async findAdaptationsByHomeworkId(homeworkId: string): Promise<Homework[]> {
    const rows = await this.prisma.homework.findMany({
      where: { homeworkId },
      orderBy: { createdAt: "asc" },
    });

    return rows.map(toDomain);
  }

  async findGeneratorsByClassId(classId: string): Promise<Homework[]> {
    const rows = await this.prisma.homework.findMany({
      where: {
        classId,
        homeworkId: null,
      },
      orderBy: { createdAt: "desc" },
    });

    return rows.map(toDomain);
  }

  async updateDraft(
    id: string,
    data: UpdateDraftHomeworkData,
  ): Promise<Homework> {
    const row = await this.prisma.homework.update({
      where: { id },
      data: {
        title: data.title,
        content: data.content,
        subject: data.subject !== undefined ? data.subject : undefined,
        question: data.question !== undefined ? data.question : undefined,
      },
    });

    return toDomain(row);
  }

  async upsertAdaptation(
    data: UpsertAdaptationHomeworkData,
  ): Promise<Homework> {
    const glossaryJson: Prisma.InputJsonValue | typeof Prisma.DbNull =
      data.glossary === null
        ? Prisma.DbNull
        : (data.glossary as unknown as Prisma.InputJsonValue);

    const row = await this.prisma.homework.upsert({
      where: {
        homeworkId_learningProfileId: {
          homeworkId: data.homeworkId,
          learningProfileId: data.learningProfileId,
        },
      },
      create: {
        title: data.title,
        content: data.content,
        subject: data.subject ?? null,
        question: data.question ?? null,
        glossary: glossaryJson,
        isDraft: false,
        homeworkId: data.homeworkId,
        learningProfileId: data.learningProfileId,
        classId: data.classId,
        teacherId: data.teacherId,
      },
      update: {
        title: data.title,
        content: data.content,
        subject: data.subject !== undefined ? data.subject : undefined,
        question: data.question !== undefined ? data.question : undefined,
        glossary: glossaryJson,
        isDraft: false,
      },
    });

    return toDomain(row);
  }

  async attachAudioFile(
    homeworkId: string,
    audioFileId: string,
  ): Promise<Homework> {
    const row = await this.prisma.homework.update({
      where: { id: homeworkId },
      data: { audioFileId },
    });

    return toDomain(row);
  }
}

function toDomain(row: HomeworkRow): Homework {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    subject: row.subject ?? null,
    question: row.question ?? null,
    glossary: toGlossary(row.glossary),
    isDraft: row.isDraft,
    homeworkId: row.homeworkId,
    learningProfileId: row.learningProfileId,
    audioFileId: row.audioFileId,
    classId: row.classId,
    teacherId: row.teacherId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toGlossary(value: Prisma.JsonValue | null): GlossaryEntry[] | null {
  if (value === null) {
    return null;
  }

  const parsed = glossarySchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}
