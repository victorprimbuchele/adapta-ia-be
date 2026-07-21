import type {
  ObjectStoragePort,
  StoreObjectInput,
  StoredObject,
} from "../../ports/object-storage.js";

/**
 * Fake de `ObjectStoragePort` em memória (ADR 009 / BE-E5.7).
 */
export class InMemoryObjectStorage implements ObjectStoragePort {
  readonly objects: Map<string, Buffer> = new Map();
  readonly calls: StoreObjectInput[] = [];

  async store(input: StoreObjectInput): Promise<StoredObject> {
    this.calls.push(input);
    this.objects.set(input.key, input.data);
    return { path: input.key };
  }

  async read(key: string): Promise<Buffer> {
    const data = this.objects.get(key);
    if (!data) {
      throw new Error(`InMemoryObjectStorage: object "${key}" not found.`);
    }
    return data;
  }
}
