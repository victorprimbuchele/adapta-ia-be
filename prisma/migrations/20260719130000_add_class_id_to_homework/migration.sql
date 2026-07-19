-- AlterTable
ALTER TABLE "homeworks" ADD COLUMN "class_id" TEXT;

-- Backfill: existing generator rows (if any) cannot be listed per class
-- without a turma. Delete orphans from early MVP seeds before enforcing NOT NULL.
DELETE FROM "homeworks" WHERE "class_id" IS NULL;

-- AlterTable
ALTER TABLE "homeworks" ALTER COLUMN "class_id" SET NOT NULL;

-- CreateIndex
CREATE INDEX "homeworks_class_id_idx" ON "homeworks"("class_id");

-- AddForeignKey
ALTER TABLE "homeworks" ADD CONSTRAINT "homeworks_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
