import type { FileType, StoredFile } from "../domain/file.js";

export interface CreateFileData {
  type: FileType;
  path: string;
  mimeType: string;
  sizeBytes: number;
}

/**
 * Persistência do registro `File` (Épico 5, BE-E5.7).
 */
export interface FileRepository {
  create(data: CreateFileData): Promise<StoredFile>;
  findById(id: string): Promise<StoredFile | null>;
}
