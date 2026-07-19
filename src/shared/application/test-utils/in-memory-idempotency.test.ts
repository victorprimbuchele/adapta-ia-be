import { InMemoryIdempotency } from "./in-memory-idempotency.js";

describe("InMemoryIdempotency", () => {
  it("adquire uma vez e libera para nova aquisição", async () => {
    const idempotency = new InMemoryIdempotency();

    await expect(idempotency.acquire("k", 60)).resolves.toBe(true);
    await expect(idempotency.acquire("k", 60)).resolves.toBe(false);

    await idempotency.release("k");
    await expect(idempotency.acquire("k", 60)).resolves.toBe(true);
  });
});
