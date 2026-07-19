-- CreateEnum
CREATE TYPE "FileType" AS ENUM ('audio');

-- CreateTable
CREATE TABLE "files" (
    "id" TEXT NOT NULL,
    "type" "FileType" NOT NULL,
    "path" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "files_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "homeworks" ADD COLUMN "audio_file_id" TEXT;

-- CreateIndex
CREATE INDEX "files_type_idx" ON "files"("type");

-- CreateIndex
CREATE UNIQUE INDEX "homeworks_audio_file_id_key" ON "homeworks"("audio_file_id");

-- AddForeignKey
ALTER TABLE "homeworks" ADD CONSTRAINT "homeworks_audio_file_id_fkey" FOREIGN KEY ("audio_file_id") REFERENCES "files"("id") ON DELETE SET NULL ON UPDATE CASCADE;
