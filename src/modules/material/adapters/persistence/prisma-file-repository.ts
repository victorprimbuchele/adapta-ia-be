import type { PrismaClient } from "../../../../generated/prisma/client.js";
import type { StoredFile } from "../../domain/file.js";
import type {
  CreateFileData,
  FileRepository,
} from "../../ports/file-repository.js";

/**
 * Implementação de `FileRepository` sobre a tabela `files` (BE-E5.7).
 */
export class PrismaFileRepository implements FileRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateFileData): Promise<StoredFile> {
    const row = await this.prisma.file.create({
      data: {
        type: data.type,
        path: data.path,
        mimeType: data.mimeType,
        sizeBytes: data.sizeBytes,
      },
    });

    return toDomain(row);
  }

  async findById(id: string): Promise<StoredFile | null> {
    const row = await this.prisma.file.findUnique({ where: { id } });
    return row ? toDomain(row) : null;
  }
}

function toDomain(row: {
  id: string;
  type: "audio" | "pdf";
  path: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: Date;
  updatedAt: Date;
}): StoredFile {
  return {
    id: row.id,
    type: row.type,
    path: row.path,
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
