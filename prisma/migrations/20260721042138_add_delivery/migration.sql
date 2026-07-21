-- CreateEnum
CREATE TYPE "DeliveryRecipientStatus" AS ENUM ('pendente', 'enviado', 'falhou');

-- CreateTable
CREATE TABLE "deliveries" (
    "id" TEXT NOT NULL,
    "homework_id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_recipients" (
    "id" TEXT NOT NULL,
    "delivery_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "variant_homework_id" TEXT,
    "status" "DeliveryRecipientStatus" NOT NULL DEFAULT 'pendente',
    "failed_reason" TEXT,
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_recipients_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "deliveries_homework_id_idx" ON "deliveries"("homework_id");

-- CreateIndex
CREATE INDEX "deliveries_teacher_id_idx" ON "deliveries"("teacher_id");

-- CreateIndex
CREATE INDEX "delivery_recipients_delivery_id_idx" ON "delivery_recipients"("delivery_id");

-- CreateIndex
CREATE INDEX "delivery_recipients_student_id_idx" ON "delivery_recipients"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX "delivery_recipients_delivery_id_student_id_key" ON "delivery_recipients"("delivery_id", "student_id");

-- AddForeignKey
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_homework_id_fkey" FOREIGN KEY ("homework_id") REFERENCES "homeworks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_recipients" ADD CONSTRAINT "delivery_recipients_delivery_id_fkey" FOREIGN KEY ("delivery_id") REFERENCES "deliveries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_recipients" ADD CONSTRAINT "delivery_recipients_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_recipients" ADD CONSTRAINT "delivery_recipients_variant_homework_id_fkey" FOREIGN KEY ("variant_homework_id") REFERENCES "homeworks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
