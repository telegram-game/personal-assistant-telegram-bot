import { v4 as uuidv4 } from 'uuid';
import { Logger } from '../logger.service';
import { formatMilliseconds } from 'src/utils';

export const Log = (prefix: string = '_') => {
  return (entity: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    const logger = new Logger(originalMethod.name);

    if (prefix === '_') {
      prefix = entity?.constructor?.name ?? prefix;
    }
    const instrumentationScope = `${prefix}.${propertyKey}`;

    descriptor.value = async function (...args: any[]) {
      const now = performance.now();
      const uuid = uuidv4();
      logger.info(
        `Method ${instrumentationScope} started`,
        {
          logId: uuid,
        },
        instrumentationScope,
      );
      try {
        return await originalMethod.apply(this, args);
      } finally {
        const executionTime = Math.round(performance.now() - now);
        logger.info(
          `Method ${instrumentationScope} ended ${formatMilliseconds(executionTime)}.`,
          {
            executionTime,
            logId: uuid,
          },
          instrumentationScope,
        );
      }
    };

    return descriptor;
  };
};
