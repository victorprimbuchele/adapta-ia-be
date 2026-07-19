import { getRedisConnectionOptions } from "./redis.js";

describe("getRedisConnectionOptions", () => {
  const originalRedisUrl = process.env["REDIS_URL"];

  afterEach(() => {
    if (originalRedisUrl === undefined) {
      delete process.env["REDIS_URL"];
    } else {
      process.env["REDIS_URL"] = originalRedisUrl;
    }
  });

  it("exige REDIS_URL", () => {
    delete process.env["REDIS_URL"];

    expect(() => getRedisConnectionOptions()).toThrow("REDIS_URL is required.");
  });

  it("parseia host, porta e senha; maxRetriesPerRequest null (BullMQ)", () => {
    process.env["REDIS_URL"] = "redis://:s%3Bcret@localhost:6380";

    expect(getRedisConnectionOptions()).toEqual({
      host: "localhost",
      port: 6380,
      password: "s;cret",
      maxRetriesPerRequest: null,
    });
  });

  it("usa porta 6379 quando omitida", () => {
    process.env["REDIS_URL"] = "redis://127.0.0.1";

    expect(getRedisConnectionOptions()).toEqual({
      host: "127.0.0.1",
      port: 6379,
      maxRetriesPerRequest: null,
    });
  });
});
