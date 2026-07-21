/*
  Warnings:

  - Added the required column `student_email` to the `delivery_recipients` table without a default value. This is not possible if the table is not empty.
  - Added the required column `student_name` to the `delivery_recipients` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "delivery_recipients" ADD COLUMN     "student_email" TEXT NOT NULL,
ADD COLUMN     "student_name" TEXT NOT NULL;
