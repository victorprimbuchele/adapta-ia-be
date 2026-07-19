import { createHomeworkAdaptationWorker } from "./modules/material/adapters/queue/create-homework-adaptation-worker.js";

/**
 * Entrypoint do processo worker (ADR 006 / BE-E5.2).
 * Consome jobs de adaptação sem acoplar a API à LLM.
 */
const worker = createHomeworkAdaptationWorker();

async function shutdown(signal: string): Promise<void> {
  console.log(`[worker] received ${signal}, shutting down…`);
  await worker.close();
  process.exit(0);
}

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});
process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});
