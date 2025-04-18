import { QueuePriority } from 'src/constants';
import { BaseMessage } from './message-base.model';

export type PredictMessage = BaseMessage & {
    id: number;
    prompt: string;
    maxTokens: number;
};

export type PredictMessageOptions = {
  priority?: QueuePriority;
};
