import {
  ConsoleLogger,
  Injectable,
  LoggerService,
  LogLevel as NestLogLevel,
} from '@nestjs/common';
import { first, isError } from 'lodash';
import { default as cfgDefault } from 'src/config/configuration';
import { LogLevel } from 'src/config/configuration.interface';
import asyncLocalStorage from 'src/storage/async_local';
const defaultTraceId = 'system';

const appName = cfgDefault().appName;

@Injectable()
export class Logger extends ConsoleLogger implements LoggerService {
  constructor(name?: string) {
    super(name ?? Logger.name);
  }

  protected override formatMessage(_: NestLogLevel, message: string): string {
    return `${message}\n`;
  }

  private static shouldWriteLogByLevel(level: LogLevel) {
    const logLevel: LogLevel = cfgDefault()?.logLevel;
    const levelByNumber = {
      all: 0,
      debug: 1,
      info: 2,
      warning: 3,
      error: 4,
    };
    const settingLevel = levelByNumber[logLevel] ?? 0;
    const currentLevel = levelByNumber[level] ?? 0;
    return currentLevel >= settingLevel;
  }

  private static writeLog(event: TelemetryEvent) {
    console.log(
      JSON.stringify(event, (_, value) => {
        if (value !== null) return value;
      }),
    );
  }

  log(message: any, ...optionalParams: [...any, string?]): void;
  log(message: any, context?: string): void;
  log(message: any, ...optionalParams: [...any, string?]): void {
    const optionalParamsReversed = [...optionalParams].reverse();
    const context = first(optionalParamsReversed);
    const attributes = optionalParamsReversed.slice(1);
    Logger.writeLog(
      new TelemetryEvent({
        traceId: asyncLocalStorage.getStore()?.cid,
        severityText: 'info',
        body: message,
        instrumentationScope: context ?? this.context,
        attributes: this.buildAttributes(attributes),
      }),
    );
  }

  info(message: string, ...optionalParams: [...any, string?]): void;
  info(message: string, context?: string): void;
  info(message: string, ...optionalParams: [...any, string?]): void {
    if (!Logger.shouldWriteLogByLevel('info')) return;
    const optionalParamsReversed = [...optionalParams].reverse();
    const context = first(optionalParamsReversed);
    const attributes = optionalParamsReversed.slice(1);
    Logger.writeLog(
      new TelemetryEvent({
        traceId: asyncLocalStorage.getStore()?.cid,
        severityText: 'info',
        body: message,
        instrumentationScope: context ?? this.context,
        attributes: this.buildAttributes(attributes),
      }),
    );
  }

  warn(message: string, ...optionalParams: [...any, string?]): void;
  warn(message: string, context?: string): void;
  warn(message: string, ...optionalParams: [...any, string?]): void {
    if (!Logger.shouldWriteLogByLevel('warn')) return;
    const optionalParamsReversed = [...optionalParams].reverse();
    const context = first(optionalParamsReversed);
    const attributes = optionalParamsReversed.slice(1);
    Logger.writeLog(
      new TelemetryEvent({
        traceId: asyncLocalStorage.getStore()?.cid,
        severityText: 'warn',
        body: message,
        instrumentationScope: context ?? this.context,
        attributes: this.buildAttributes(attributes),
      }),
    );
  }

  debug(message: string, ...optionalParams: [...any, string?]): void;
  debug(message: string, context?: string): void;
  debug(message: string, ...optionalParams: [...any, string?]): void {
    if (!Logger.shouldWriteLogByLevel('debug')) return;
    const optionalParamsReversed = [...optionalParams].reverse();
    const context = first(optionalParamsReversed);
    const attributes = optionalParamsReversed.slice(1);
    Logger.writeLog(
      new TelemetryEvent({
        traceId: asyncLocalStorage.getStore()?.cid,
        severityText: 'debug',
        body: message,
        instrumentationScope: context ?? this.context,
        attributes: this.buildAttributes(attributes),
      }),
    );
  }

  error(
    message: string,
    stack?: unknown,
    context?: string,
    ...optionalParams: [...any]
  ): void;
  error(message: string, stack?: unknown, context?: string): void;
  error(message: string, ...optionalParams: [unknown?, string?, ...any]): void;
  error(
    message: string,
    stack?: unknown,
    context?: string,
    ...attributes: [...any]
  ): void {
    if (!Logger.shouldWriteLogByLevel('error')) return;

    let traceFlags = '';
    if (isError(stack)) traceFlags = (stack as Error).stack;
    else traceFlags = JSON.stringify(stack || {});
    Logger.writeLog(
      new TelemetryEvent({
        traceId: asyncLocalStorage.getStore()?.cid,
        traceFlags: traceFlags,
        severityText: 'error',
        body: message,
        instrumentationScope: context ?? this.context,
        attributes: this.buildAttributes(attributes),
      }),
    );
  }

  private buildAttributes(attributes: any[]) {
    try {
      return attributes.filter(Boolean).reduce((acc, curr, index) => {
        if (!Array.isArray(curr) && typeof curr === 'object') {
          return Object.assign(
            acc,
            Object.keys(curr)
              .filter(Boolean)
              .reduce((acc, key) => {
                acc[key] = curr[key].toString();
                return acc;
              }, {}),
          );
        } else if (Array.isArray(curr)) {
          acc[index] = JSON.stringify(curr);
        }
        acc[index] = curr.toString();
        return acc;
      }, {});
    } catch {
      return attributes.reduce((acc, curr, index) => {
        if (curr) acc[index] = curr.toString();
        return acc;
      });
    }
  }
}

class TelemetryEvent {
  timestamp: number;
  observedTimestamp?: number;
  traceId: string;
  spanId?: string;
  traceFlags?: string;
  severityText: LogLevel;
  severityNumber: number;
  body: any;
  resource: string;
  instrumentationScope: any | string;
  attributes?: Record<string, any>;

  constructor(
    data: Omit<TelemetryEvent, 'resource' | 'timestamp' | 'severityNumber'>,
  ) {
    Object.assign(this, data);
    const now = Date.now();
    const severityNumber: Record<LogLevel, number> = {
      log: 9,
      warn: 13,
      error: 17,
      debug: 5,
      verbose: 0,
      info: 9,
      fatal: 21,
    };
    this.timestamp = now * 1000000;
    this.severityNumber = severityNumber[data.severityText];
    this.resource = appName;
    this.traceId = data.traceId ?? defaultTraceId;
  }
}
