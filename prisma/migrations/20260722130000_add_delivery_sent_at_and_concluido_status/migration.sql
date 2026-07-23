-- Status terminal do envio e timestamp de conclusão do lote (Épico 7, BE-E7.7).
ALTER TYPE "DeliveryStatus" ADD VALUE 'concluido';

ALTER TABLE "deliveries" ADD COLUMN "sent_at" TIMESTAMP(3);
