import { mapQueueState } from "./bullmq-adaptation-job-status.js";

describe("mapQueueState", () => {
  it("mapeia estados BullMQ para o domínio de polling", () => {
    expect(mapQueueState("waiting")).toBe("waiting");
    expect(mapQueueState("delayed")).toBe("waiting");
    expect(mapQueueState("prioritized")).toBe("waiting");
    expect(mapQueueState("active")).toBe("active");
    expect(mapQueueState("completed")).toBe("completed");
    expect(mapQueueState("failed")).toBe("failed");
    expect(mapQueueState("stuck")).toBe("unknown");
  });
});
