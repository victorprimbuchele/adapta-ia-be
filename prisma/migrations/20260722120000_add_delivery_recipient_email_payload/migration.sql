-- Snapshot do conteúdo enviado por e-mail (Épico 7, BE-E7.4).
ALTER TABLE "delivery_recipients" ADD COLUMN "email_payload" JSONB NOT NULL DEFAULT '{"homeworkId":"","title":""}';

ALTER TABLE "delivery_recipients" ALTER COLUMN "email_payload" DROP DEFAULT;
