-- CreateEnum
CREATE TYPE "TrainDataStatus" AS ENUM ('PENDING', 'DONE', 'FAILED');

-- CreateTable
CREATE TABLE "train_data" (
    "id" SERIAL NOT NULL,
    "data" TEXT NOT NULL,
    "telegram_bot_message_id" INTEGER,
    "status" "TrainDataStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "train_data_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "train_data_telegram_bot_message_id_key" ON "train_data"("telegram_bot_message_id");

-- AddForeignKey
ALTER TABLE "train_data" ADD CONSTRAINT "train_data_telegram_bot_message_id_fkey" FOREIGN KEY ("telegram_bot_message_id") REFERENCES "telegram-bot-messages"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
