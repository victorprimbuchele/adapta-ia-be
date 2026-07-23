-- AlterEnum
ALTER TYPE "FileType" ADD VALUE 'pdf';

-- AlterTable
ALTER TABLE "homeworks" ADD COLUMN "content_file_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "homeworks_content_file_id_key" ON "homeworks"("content_file_id");

-- AddForeignKey
ALTER TABLE "homeworks" ADD CONSTRAINT "homeworks_content_file_id_fkey" FOREIGN KEY ("content_file_id") REFERENCES "files"("id") ON DELETE SET NULL ON UPDATE CASCADE;
