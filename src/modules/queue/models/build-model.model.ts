import { QueuePriority } from 'src/constants';
import { BaseMessage } from './message-base.model';

export type BuildModel = BaseMessage & {
  id: number;
  name: string;
  fromModelPath?: string;
  dataFilePath: string;
};

export type BuildModelOptions = {
  priority?: QueuePriority;
  timeout?: number;
};
