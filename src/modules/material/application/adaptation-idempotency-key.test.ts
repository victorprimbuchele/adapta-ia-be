import {
  adaptationIdempotencyKey,
  adaptationIdempotencyTtlSeconds,
} from "./adaptation-idempotency-key.js";

describe("adaptationIdempotencyKey", () => {
  it("gera chave estável por par atividade+perfil", () => {
    expect(adaptationIdempotencyKey("hw-1", "profile-2")).toBe(
      "idempotency:adaptation:hw-1:profile-2",
    );
  });
});

describe("adaptationIdempotencyTtlSeconds", () => {
  const previous = process.env["ADAPTATION_IDEMPOTENCY_TTL_SECONDS"];

  afterEach(() => {
    if (previous === undefined) {
      delete process.env["ADAPTATION_IDEMPOTENCY_TTL_SECONDS"];
    } else {
      process.env["ADAPTATION_IDEMPOTENCY_TTL_SECONDS"] = previous;
    }
  });

  it("usa 24h por padrão", () => {
    delete process.env["ADAPTATION_IDEMPOTENCY_TTL_SECONDS"];
    expect(adaptationIdempotencyTtlSeconds()).toBe(86_400);
  });

  it("respeita ADAPTATION_IDEMPOTENCY_TTL_SECONDS", () => {
    process.env["ADAPTATION_IDEMPOTENCY_TTL_SECONDS"] = "120";
    expect(adaptationIdempotencyTtlSeconds()).toBe(120);
  });
});
