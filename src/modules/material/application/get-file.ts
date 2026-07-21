import { FileNotFoundError } from "../domain/errors.js";
import type { StoredFile } from "../domain/file.js";
import type { FileRepository } from "../ports/file-repository.js";
import type { ObjectStoragePort } from "../ports/object-storage.js";

export interface GetFileResult {
  file: StoredFile;
  data: Buffer;
}

/**
 * Lê um arquivo persistido (registro `File` + bytes no storage) — usado
 * para servir o áudio TTS das variantes (Épico 5, BE-E5.7). Sem checagem
 * fina de propriedade (mesmo padrão já adotado em
 * POST /alunos/:id/perfil-aprendizagem): basta estar autenticado.
 */
export class GetFile {
  constructor(
    private readonly fileRepository: FileRepository,
    private readonly objectStorage: ObjectStoragePort,
  ) {}

  async execute(fileId: string): Promise<GetFileResult> {
    const file = await this.fileRepository.findById(fileId);
    if (!file) {
      throw new FileNotFoundError(fileId);
    }

    const data = await this.objectStorage.read(file.path);

    return { file, data };
  }
}
