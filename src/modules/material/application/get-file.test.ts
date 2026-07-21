import { GetFile } from "./get-file.js";
import { InMemoryFileRepository } from "./test-utils/in-memory-file-repository.js";
import { InMemoryObjectStorage } from "./test-utils/in-memory-object-storage.js";
import { FileNotFoundError } from "../domain/errors.js";

describe("GetFile", () => {
  it("retorna o registro do arquivo e os bytes lidos do storage", async () => {
    const fileRepository = new InMemoryFileRepository();
    const objectStorage = new InMemoryObjectStorage();
    const created = await fileRepository.create({
      type: "audio",
      path: "homeworks/h1/audio.mp3",
      mimeType: "audio/mpeg",
      sizeBytes: 4,
    });
    await objectStorage.store({
      key: "homeworks/h1/audio.mp3",
      data: Buffer.from("data"),
      mimeType: "audio/mpeg",
    });
    const getFile = new GetFile(fileRepository, objectStorage);

    const result = await getFile.execute(created.id);

    expect(result.file).toEqual(created);
    expect(result.data.toString()).toBe("data");
  });

  it("rejeita quando o arquivo não existe", async () => {
    const getFile = new GetFile(new InMemoryFileRepository(), new InMemoryObjectStorage());

    await expect(getFile.execute("arquivo-inexistente")).rejects.toBeInstanceOf(FileNotFoundError);
  });
});
