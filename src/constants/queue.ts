export enum QueuePriority {
  Low = 4,
  Normal = 3,
  High = 2,
  Critical = 1,
}

export const QUEUE_PREFIX = '{prefix}:queues';
export const TELEGRAM_MESSAGE_QUEUE = 'telegram-message-queue';
export const BUILD_MODEL_QUEUE = 'build-model-queue';
