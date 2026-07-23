-- Homeworks com envio registrado deixam de ser rascunho (corrige dados anteriores à publishGenerator).
UPDATE "homeworks" h
SET
  "is_draft" = false,
  "updated_at" = CURRENT_TIMESTAMP
WHERE
  h."homework_id" IS NULL
  AND h."is_draft" = true
  AND EXISTS (
    SELECT 1
    FROM "deliveries" d
    WHERE d."homework_id" = h."id"
  );
