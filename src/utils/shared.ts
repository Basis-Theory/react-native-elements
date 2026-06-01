import type { Token } from '../types';
import { anyPass, equals, is, isEmpty, isNil, replace, type } from 'ramda';
import type { BTRef, InputBTRefWithDatepart } from '../BaseElementTypes';
import type { CardBrand } from '../CardElementTypes';

const isString = is(String);
const isBoolean = is(Boolean);
const isNumber = is(Number);
const isRegExp = is(RegExp);
const isNilOrEmpty = anyPass([isNil, isEmpty]);

const extractDigits = (value = ''): string | undefined =>
  value ? replace(/\D+/gu, '', value) : undefined;

const isObject = (val: unknown): val is Record<string, unknown> =>
  equals('Object', type(val));

const isToken = (val: unknown): val is Token =>
  !isNil((val as Token).data) && !isNil((val as Token).type);

const isBtRef = (val: unknown): val is BTRef =>
  isObject(val) && 'id' in val && 'format' in val;

const isBtDateRef = (val: unknown): val is InputBTRefWithDatepart =>
  isObject(val) && 'datepart' in val;

const isPrimitive = anyPass([isNil, isString, isBoolean, isNumber]);

/**
 * Removes all occurrences of the maximum value from an array of numbers.
 */
const filterOutMaxOccurrences = (numbers: number[]) =>
  numbers.filter((num) => num !== Math.max(...numbers));


const convertApiBrandToBrand = (apiBrandName: string): CardBrand => {
  const converted = apiBrandName.toLowerCase().replace(/[\s_]+/g, '-') as CardBrand;
  return converted || 'unknown';
};

const labelizeCardBrand = (value: CardBrand): string => {
  const exceptions: Record<string, string> = {
    'american-express': 'American Express',
    'diners-club': 'Diners Club',
    'cartes-bancaires': 'Cartes Bancaires',
    'eftpos-australia': 'EFTPOS Australia',
    'private-label': 'Private Label',
    'korean-local': 'Korean Local',
    jcb: 'JCB',
    unionpay: 'UnionPay',
    hipercard: 'Hipercard',
    uapt: 'UATP',
  };

  if (exceptions[value]) {
    return exceptions[value];
  }

  return value
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};


export {
  convertApiBrandToBrand,
  extractDigits,
  labelizeCardBrand,
  filterOutMaxOccurrences,
  isBoolean,
  isBtDateRef,
  isBtRef,
  isNilOrEmpty,
  isNumber,
  isObject,
  isPrimitive,
  isRegExp,
  isString,
  isToken,
};
