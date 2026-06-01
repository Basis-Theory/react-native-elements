/**
 * Native JavaScript utility functions
 * Simplified versions for React Native Elements
 */

// Replace ramda/isNil
export const isNil = (value: unknown): value is null | undefined => {
  return value == null;
};

/**
 * Converts string to string representation for safe processing
 */
const toString = (value: unknown): string => {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  return String(value);
};

/**
 * Capitalizes the first character of a string
 */
const capitalize = (string: string): string => {
  if (!string) return string;
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
};

/**
 * Checks if string contains Unicode word characters
 */
const hasUnicodeWord = (string: string): boolean => {
  return /[a-z][A-Z]|[A-Z]{2}[a-z]|[0-9][a-zA-Z]|[a-zA-Z][0-9]|[^a-zA-Z0-9 ]/.test(
    string
  );
};

/**
 * Extracts ASCII words from string
 */
const asciiWords = (string: string): string[] => {
  const words = string.split(/[^a-zA-Z0-9]+/).filter((word) => word.length > 0);
  return words;
};

/**
 * Extracts Unicode words from string
 */
const unicodeWords = (string: string): string[] => {
  const pattern = [
    '[A-Z][a-z]+',
    '[A-Z]+(?=[A-Z][a-z]|[^a-zA-Z]|$)',
    '[a-z]+',
    '\\d+',
    '[\\u00C0-\\u024F\\u1E00-\\u1EFF]+',
  ].join('|');

  const matches = string.match(new RegExp(pattern, 'g'));
  return matches || [];
};

/**
 * Extracts words from string, handling both ASCII and Unicode
 */
const words = (string: string): string[] => {
  const str = toString(string);
  if (!str) return [];

  return hasUnicodeWord(str) ? unicodeWords(str) : asciiWords(str);
};

/**
 * Reduces array using callback function
 */
const arrayReduce = <T, R>(
  array: T[],
  callback: (accumulator: R, value: T, index: number) => R,
  initialValue: R
): R => {
  return array.reduce(callback, initialValue);
};

/**
 * Creates a compounder function
 */
const createCompounder = (
  callback: (result: string, word: string, index: number) => string
) => {
  return (string: unknown): string => {
    const str = toString(string);
    if (!str) return '';

    // Remove apostrophes
    const cleaned = str.replace(/['\u2019]/g, '');
    const wordsArray = words(cleaned);

    return arrayReduce(wordsArray, callback, '');
  };
};

/**
 * Converts string to snake_case
 */
export const snakeCase = createCompounder(
  (result: string, word: string, index: number): string => {
    return result + (index ? '_' : '') + word.toLowerCase();
  }
);

/**
 * Converts string to camelCase
 */
export const camelCase = createCompounder(
  (result: string, word: string, index: number): string => {
    const processedWord = word.toLowerCase();
    return result + (index ? capitalize(processedWord) : processedWord);
  }
);
