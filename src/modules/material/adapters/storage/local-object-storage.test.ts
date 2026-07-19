import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { LocalObjectStorage } from "./local-object-storage.js";

describe("LocalObjectStorage", () => {
  let rootDir: string;

  beforeEach(async () => {
    rootDir = await mkdtemp(path.join(tmpdir(), "adapta-storage-"));
  });

  afterEach(async () => {
    await rm(rootDir, { recursive: true, force: true });
  });

  it("grava o objeto no filesystem e devolve o path relativo", async () => {
    const storage = new LocalObjectStorage({ rootDir });
    const data = Buffer.from("fake-mp3");

    const stored = await storage.store({
      key: "homeworks/hw-1/audio.mp3",
      data,
      mimeType: "audio/mpeg",
    });

    expect(stored.path).toBe("homeworks/hw-1/audio.mp3");
    await expect(
      readFile(path.join(rootDir, stored.path)),
    ).resolves.toEqual(data);
  });
});
