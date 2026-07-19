import { adaptationJobId } from "./bullmq-adaptation-queue.js";

describe("adaptationJobId", () => {
  it("gera id estável por par homework+perfil", () => {
    expect(
      adaptationJobId({
        homeworkId: "hw-1",
        learningProfileId: "profile-2",
        teacherId: "teacher-1",
      }),
    ).toBe("adapt:hw-1:profile-2");
  });
});
