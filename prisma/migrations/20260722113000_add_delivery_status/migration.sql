-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('pendente', 'agendado');

-- AlterTable
ALTER TABLE "deliveries" ADD COLUMN "status" "DeliveryStatus" NOT NULL DEFAULT 'agendado';
