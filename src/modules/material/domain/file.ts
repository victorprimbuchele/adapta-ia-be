/**
 * Arquivo persistido em storage (Épico 5, BE-E5.7).
 * No MVP o tipo suportado é áudio TTS das variantes.
 */
export type FileType = "audio";

export interface StoredFile {
  id: string;
  type: FileType;
  path: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: Date;
  updatedAt: Date;
}
