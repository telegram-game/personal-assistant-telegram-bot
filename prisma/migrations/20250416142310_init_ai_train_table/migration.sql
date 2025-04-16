-- AlterEnum
ALTER TYPE "TrainDataStatus" ADD VALUE 'PROCESSING';

-- AlterTable
ALTER TABLE "train_data" ADD COLUMN     "ai_model_id" INTEGER;

-- CreateTable
CREATE TABLE "ai_models" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "telegram_bot_message_id" INTEGER,
    "path" TEXT NOT NULL,
    "base_model_id" INTEGER,
    "status" "TrainDataStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "ai_models_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ai_models_name_key" ON "ai_models"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ai_models_telegram_bot_message_id_key" ON "ai_models"("telegram_bot_message_id");

-- AddForeignKey
ALTER TABLE "ai_models" ADD CONSTRAINT "ai_models_telegram_bot_message_id_fkey" FOREIGN KEY ("telegram_bot_message_id") REFERENCES "telegram-bot-messages"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
