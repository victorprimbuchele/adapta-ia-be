-- DropForeignKey
ALTER TABLE "homeworks" DROP CONSTRAINT "homeworks_homework_id_fkey";

-- DropForeignKey
ALTER TABLE "homeworks" DROP CONSTRAINT "homeworks_learning_profile_id_fkey";

-- AddForeignKey
ALTER TABLE "homeworks" ADD CONSTRAINT "homeworks_homework_id_fkey" FOREIGN KEY ("homework_id") REFERENCES "homeworks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homeworks" ADD CONSTRAINT "homeworks_learning_profile_id_fkey" FOREIGN KEY ("learning_profile_id") REFERENCES "learning_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
