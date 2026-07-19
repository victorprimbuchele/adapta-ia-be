import type { StoredFile } from "../../domain/file.js";
import type {
  CreateFileData,
  FileRepository,
} from "../../ports/file-repository.js";

let nextId = 1;

/**
 * Fake de `FileRepository` em memória (ADR 009 / BE-E5.7).
 */
export class InMemoryFileRepository implements FileRepository {
  readonly files: StoredFile[] = [];

  async create(data: CreateFileData): Promise<StoredFile> {
    const now = new Date();
    const file: StoredFile = {
      id: `file-${nextId++}`,
      type: data.type,
      path: data.path,
      mimeType: data.mimeType,
      sizeBytes: data.sizeBytes,
      createdAt: now,
      updatedAt: now,
    };

    this.files.push(file);
    return file;
  }

  async findById(id: string): Promise<StoredFile | null> {
    return this.files.find((file) => file.id === id) ?? null;
  }
}
