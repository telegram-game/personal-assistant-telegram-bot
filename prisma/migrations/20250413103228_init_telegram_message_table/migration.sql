-- CreateEnum
CREATE TYPE "TetegramBotMessageType" AS ENUM ('ASK', 'TRAIN', 'START_TRAIN', 'APPROVE');

-- CreateTable
CREATE TABLE "telegram-bot-messages" (
    "id" SERIAL NOT NULL,
    "chat_id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "type" "TetegramBotMessageType" NOT NULL,
    "text" TEXT,
    "type_message" TEXT,
    "sender" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reply_at" TIMESTAMP(3),

    CONSTRAINT "telegram-bot-messages_pkey" PRIMARY KEY ("id")
);
