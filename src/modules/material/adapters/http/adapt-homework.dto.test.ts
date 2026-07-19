import { adaptHomeworkSchema } from "./adapt-homework.dto.js";

describe("adaptHomeworkSchema", () => {
  it("accepts an empty body (profiles come from the class)", () => {
    const result = adaptHomeworkSchema.safeParse({});

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.learningProfileIds).toBeUndefined();
    }
  });

  it("accepts selected learning profile ids", () => {
    const result = adaptHomeworkSchema.safeParse({
      learningProfileIds: ["  profile-1  ", "profile-2"],
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.learningProfileIds).toEqual([
        "profile-1",
        "profile-2",
      ]);
    }
  });

  it("rejects blank learning profile ids", () => {
    const result = adaptHomeworkSchema.safeParse({
      learningProfileIds: [""],
    });

    expect(result.success).toBe(false);
  });
});
