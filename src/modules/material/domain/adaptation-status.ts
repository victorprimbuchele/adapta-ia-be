/**
 * Status de polling da adaptação (Épico 5, BE-E5.9).
 * `concluido` só quando a variante está completa para o perfil.
 */
export type AdaptationStatus =
  | "pendente"
  | "processando"
  | "concluido"
  | "erro";

export type AdaptationQueueJobState =
  | "waiting"
  | "active"
  | "completed"
  | "failed"
  | "unknown";
