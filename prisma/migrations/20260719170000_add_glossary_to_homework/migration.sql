-- AlterTable
ALTER TABLE "homeworks" ADD COLUMN "glossary" JSONB;

-- CreateIndex
CREATE UNIQUE INDEX "homeworks_homework_id_learning_profile_id_key" ON "homeworks"("homework_id", "learning_profile_id");
