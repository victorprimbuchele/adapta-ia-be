import { RedisIdempotency } from "./redis-idempotency.js";

describe("RedisIdempotency", () => {
  it("adquire na primeira chamada e rejeita a segunda (SET NX)", async () => {
    const store: Map<string, string> = new Map();
    const redis = {
      set: jest.fn(async (key: string, _value: string, ...args: unknown[]) => {
        const nx = args.includes("NX");
        if (nx && store.has(key)) {
          return null;
        }
        store.set(key, "1");
        return "OK";
      }),
      del: jest.fn(async (key: string) => {
        store.delete(key);
        return 1;
      }),
    };

    const idempotency = new RedisIdempotency(redis as never);

    await expect(idempotency.acquire("k1", 60)).resolves.toBe(true);
    await expect(idempotency.acquire("k1", 60)).resolves.toBe(false);

    await idempotency.release("k1");
    await expect(idempotency.acquire("k1", 60)).resolves.toBe(true);

    expect(redis.set).toHaveBeenCalledWith("k1", "1", "EX", 60, "NX");
  });
});
