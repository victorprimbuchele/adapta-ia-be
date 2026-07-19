/**
 * Porta de armazenamento de objetos (Épico 5, BE-E5.7 / ADR 003).
 * No MVP o adapter é filesystem local; trocar por S3 = trocar o adapter.
 */
export interface StoreObjectInput {
  /** Chave relativa no storage (ex.: `homeworks/<id>/audio.mp3`). */
  key: string;
  data: Buffer;
  mimeType: string;
}

export interface StoredObject {
  /** Caminho/chave persistida no registro `File.path`. */
  path: string;
}

export interface ObjectStoragePort {
  store(input: StoreObjectInput): Promise<StoredObject>;
}
