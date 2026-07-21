import { createHomeworkAdaptationWorker } from "./modules/material/adapters/queue/create-homework-adaptation-worker.js";
import { createDeliveryWorker } from "./modules/entrega/adapters/queue/create-delivery-worker.js";

/**
 * Entrypoint do processo worker (ADR 006 / BE-E5.2 / BE-E6.2).
 * Consome jobs de adaptação e de envio sem acoplar a API à LLM/TTS/SMTP.
 */
const adaptationWorker = createHomeworkAdaptationWorker();
const deliveryWorker = createDeliveryWorker();

async function shutdown(signal: string): Promise<void> {
  console.log(`[worker] received ${signal}, shutting down…`);
  await Promise.all([adaptationWorker.close(), deliveryWorker.close()]);
  process.exit(0);
}

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});
process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});
