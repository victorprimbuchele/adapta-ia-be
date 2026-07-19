import { InMemoryIdempotency } from "../../../shared/application/test-utils/in-memory-idempotency.js";
import { adaptationIdempotencyKey } from "./adaptation-idempotency-key.js";
import { releaseAdaptationIdempotencyOnFinalFailure } from "./release-adaptation-idempotency-on-final-failure.js";

describe("releaseAdaptationIdempotencyOnFinalFailure", () => {
  it("libera a chave só na falha persistente (última tentativa)", async () => {
    const idempotency = new InMemoryIdempotency();
    const key = adaptationIdempotencyKey("hw-1", "profile-1");
    await idempotency.acquire(key, 60);

    await releaseAdaptationIdempotencyOnFinalFailure(
      {
        data: {
          homeworkId: "hw-1",
          learningProfileId: "profile-1",
          teacherId: "teacher-1",
        },
        attemptsMade: 1,
        opts: { attempts: 3 },
      },
      idempotency,
    );

    expect(idempotency.keys.has(key)).toBe(true);

    await releaseAdaptationIdempotencyOnFinalFailure(
      {
        data: {
          homeworkId: "hw-1",
          learningProfileId: "profile-1",
          teacherId: "teacher-1",
        },
        attemptsMade: 3,
        opts: { attempts: 3 },
      },
      idempotency,
    );

    expect(idempotency.keys.has(key)).toBe(false);
  });
});
