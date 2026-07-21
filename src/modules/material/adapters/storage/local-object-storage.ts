import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type {
  ObjectStoragePort,
  StoreObjectInput,
  StoredObject,
} from "../../ports/object-storage.js";

/**
 * Adapter de `ObjectStoragePort` em filesystem local (Épico 5, BE-E5.7).
 * Env: `STORAGE_PATH` (default `./storage`).
 */
export class LocalObjectStorage implements ObjectStoragePort {
  private readonly rootDir: string;

  constructor(options?: { rootDir?: string }) {
    this.rootDir = path.resolve(
      options?.rootDir ?? process.env["STORAGE_PATH"] ?? "./storage",
    );
  }

  async store(input: StoreObjectInput): Promise<StoredObject> {
    const relativeKey = input.key.replace(/^\/+/, "");
    const absolutePath = path.join(this.rootDir, relativeKey);

    await mkdir(path.dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, input.data);

    return { path: relativeKey };
  }

  async read(key: string): Promise<Buffer> {
    const relativeKey = key.replace(/^\/+/, "");
    const absolutePath = path.join(this.rootDir, relativeKey);

    return readFile(absolutePath);
  }
}
