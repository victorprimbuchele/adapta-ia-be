import { ProcessHomeworkAdaptation } from "./process-homework-adaptation.js";

describe("ProcessHomeworkAdaptation", () => {
  it("consome o job sem lançar (worker não bloqueia a request HTTP)", async () => {
    const processHomeworkAdaptation = new ProcessHomeworkAdaptation();
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    await expect(
      processHomeworkAdaptation.execute({
        homeworkId: "homework-1",
        learningProfileId: "profile-1",
        teacherId: "teacher-1",
      }),
    ).resolves.toBeUndefined();

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining("homework=homework-1"),
    );
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining("profile=profile-1"),
    );

    logSpy.mockRestore();
  });
});
