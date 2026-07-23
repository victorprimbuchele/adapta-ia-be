/**
 * Arquivo persistido em storage (Épico 5, BE-E5.7; PDF — Épico 6, BE-E6.2).
 */
export type FileType = "audio" | "pdf";

export interface StoredFile {
  id: string;
  type: FileType;
  path: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: Date;
  updatedAt: Date;
}
