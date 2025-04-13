import { IsNumberOptions, isNumber } from 'class-validator';
import dayjs from 'dayjs';
import { times } from 'lodash';
import { default as cfgDefault } from 'src/config/configuration';
import { randomBytes } from 'crypto';

export const parseFromJson: any = (str: string) => {
  try {
    return JSON.parse(str);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('\n ==> ERROR [parseFromJson]:', e.message, '\n');
    return str;
  }
};

export function roundDecimalPrecision(
  number: number,
  fractionDigits: number,
): number {
  return Number.parseFloat(number.toFixed(fractionDigits));
}

export function formatNumber(
  number: number,
  isCurrency = true,
  locale = 'en-US',
  currency = 'SGD',
): string {
  const options: Intl.NumberFormatOptions = { currency, style: 'currency' };

  if (!isCurrency) {
    Object.assign(options, { style: 'decimal' });
  }

  return new Intl.NumberFormat(locale, options).format(number);
}

export const applyMixins = (baseClass: any, extendedClasses: any[]) => {
  extendedClasses.forEach((extendedClass) => {
    Object.getOwnPropertyNames(extendedClass.prototype).forEach((name) => {
      Object.defineProperty(
        baseClass.prototype,
        name,
        Object.getOwnPropertyDescriptor(extendedClass.prototype, name) ||
          Object.create(null),
      );
    });
  });
};

export const stringifyAnObject: any = (str: Record<string, any>) => {
  try {
    return JSON.stringify(str);
  } catch (e) {
    return `stringify Unexpected Error: ${e}`;
  }
};

export const generateKeyByCount = (count: number) => {
  let id = '';

  function s4() {
    return randomBytes(2).toString('hex'); // Generates a secure 4-character hex string
  }

  times(count, () => {
    id += s4();
  });

  return id;
};

export function roundToTwo(num: number) {
  return +(Math.round((num + 'e+2') as unknown as number) + 'e-2');
}

export function generateCID(cid?: string) {
  if (cid) return cid;
  const now = dayjs();
  const prefix = `${cfgDefault()?.appName?.toLowerCase()}`;
  const randomPart = randomBytes(2).readUInt16BE(0) % 1000;
  return `${prefix}-${now.format('YYYYMMDDHH-mmssSSS')}-${randomPart
    .toString()
    .padStart(3, '0')}`;
}

export function formatMilliseconds(ms: number) {
  return `${ms}ms`;
}

export function parseNumber(
  value: unknown,
  options: IsNumberOptions & { default: number } = {
    allowInfinity: false,
    allowNaN: false,
    default: 0,
  },
): number {
  return isNumber(Number(value), options) ? Number(value) : options.default;
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
