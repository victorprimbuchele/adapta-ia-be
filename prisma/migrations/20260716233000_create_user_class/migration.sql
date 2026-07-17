-- CreateTable
CREATE TABLE "user_classes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_classes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_classes_user_id_idx" ON "user_classes"("user_id");

-- CreateIndex
CREATE INDEX "user_classes_class_id_idx" ON "user_classes"("class_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_classes_user_id_class_id_key" ON "user_classes"("user_id", "class_id");

-- AddForeignKey
ALTER TABLE "user_classes" ADD CONSTRAINT "user_classes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_classes" ADD CONSTRAINT "user_classes_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
