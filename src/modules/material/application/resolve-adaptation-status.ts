import type { LearningProfilePrompt } from "../../escola/domain/learning-profile-prompt.js";
import type {
  AdaptationQueueJobState,
  AdaptationStatus,
} from "../domain/adaptation-status.js";
import type { Homework } from "../domain/homework.js";
import { isVariantAdaptationComplete } from "./is-variant-adaptation-complete.js";

export interface ResolveAdaptationStatusInput {
  jobState: AdaptationQueueJobState | null;
  variant: Homework | null;
  profilePrompt: LearningProfilePrompt | null;
  /** Tentativas já feitas; > 0 com job waiting/delayed = retry em backoff. */
  attemptsMade?: number;
}

/**
 * Deriva o status de um par geradora+perfil (BE-E5.9 / BE-E5.10).
 * Nunca retorna `concluido` se a variante ainda não está completa
 * (ex.: texto upsertado antes do TTS). Durante retry com backoff,
 * permanece `processando` (não marca `erro` até falha persistente).
 */
export function resolveAdaptationStatus(
  input: ResolveAdaptationStatusInput,
): AdaptationStatus {
  const { jobState, variant, profilePrompt, attemptsMade = 0 } = input;

  if (jobState === "failed") {
    return "erro";
  }

  if (jobState === "active") {
    return "processando";
  }

  if (jobState === "waiting") {
    // delayed/waiting após falha retriável = ainda tentando (BE-E5.10).
    return attemptsMade > 0 ? "processando" : "pendente";
  }

  const complete =
    variant !== null &&
    profilePrompt !== null &&
    isVariantAdaptationComplete(variant, profilePrompt);

  if (complete) {
    return "concluido";
  }

  if (jobState === "completed") {
    return "erro";
  }

  if (variant !== null) {
    // Texto pode já existir enquanto o job ainda não terminou o TTS,
    // ou ficou órfã após falha/remoção do job.
    return jobState === null ? "erro" : "processando";
  }

  return "pendente";
}

/**
 * Agrega status por perfil: erro > processando > pendente > concluido.
 */
export function aggregateAdaptationStatus(
  statuses: AdaptationStatus[],
): AdaptationStatus {
  if (statuses.length === 0) {
    return "pendente";
  }

  if (statuses.includes("erro")) {
    return "erro";
  }

  if (statuses.includes("processando")) {
    return "processando";
  }

  if (statuses.includes("pendente")) {
    return "pendente";
  }

  return "concluido";
}
