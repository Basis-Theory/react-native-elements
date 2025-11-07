import { camelCase, snakeCase } from '../utils/nativeUtils';

type TransformKeyCase<
  S extends string,
  Case extends 'camel' | 'snake'
> = S extends '_debug'
  ? S // Exception: preserve '_debug' as-is for backwards compatibility
  : Case extends 'camel'
  ? S extends `_${infer RestAfterUnderscore}`
    ? TransformKeyCase<RestAfterUnderscore, 'camel'> // Strip leading underscore for camelCase too
    : S extends `${infer First}_${infer Rest}`
    ? `${First}${Capitalize<TransformKeyCase<Rest, 'camel'>>}`
    : S
  : S extends `_${infer RestAfterUnderscore}`
  ? TransformKeyCase<RestAfterUnderscore, 'snake'> // Strip leading underscore and process rest
  : S extends `${infer Start}${infer Rest}`
  ? `${Start extends Uppercase<Start>
      ? '_'
      : ''}${Lowercase<Start>}${TransformKeyCase<Rest, 'snake'>}`
  : S;

export type DeepTransformKeysCase<
  T,
  Case extends 'camel' | 'snake',
  IgnorePrivate extends boolean = false
> = T extends string
  ? TransformKeyCase<T, Case>
  : T extends object
  ? {
      [K in keyof T as K extends string
        ? IgnorePrivate extends true
          ? K extends `_${string}`
            ? never // Exclude keys starting with underscore
            : TransformKeyCase<K, Case>
          : TransformKeyCase<K, Case>
        : K]: DeepTransformKeysCase<T[K], Case, IgnorePrivate>;
    }
  : T;

/**
 * Recursively transforms object keys using the provided transform function
 * Handles nested objects, arrays, and preserves non-object values
 */
const transformKeysDeep = <T>(
  obj: unknown,
  transformFn: (key: string) => string,
  ignorePrivate: boolean = false
): T => {
  const _convertCasing = (val: unknown) => {
    if (val === null || val === undefined) {
      return obj;
    }

    if (Array.isArray(val)) {
      return val.map((item) =>
        transformKeysDeep(item, transformFn, ignorePrivate)
      );
    }

    if (typeof val === 'object' && val.constructor === Object) {
      const transformedObj: Record<string, unknown> = {};

      for (const [key, value] of Object.entries(val)) {
        // Skips debug for backwards compatibility
        if (key == '_debug') {
          transformedObj[key] = value;
          continue;
        }

        const transformedKey = transformFn(key);
        transformedObj[transformedKey] = transformKeysDeep(
          value,
          transformFn,
          ignorePrivate
        );
      }

      return transformedObj;
    }

    // Return primitive values unchanged
    return val;
  };

  return _convertCasing(obj) as T;
};

/**
 * Converts object keys from camelCase to snake_case recursively
 */
export const convertToSnakeCase = <T>(
  obj: T
): DeepTransformKeysCase<T, 'snake'> => transformKeysDeep(obj, snakeCase);

/**
 * Converts object keys from snake_case to camelCase recursively
 */
export const convertToCamelCase = <T>(
  obj: T
): DeepTransformKeysCase<T, 'camel'> => transformKeysDeep(obj, camelCase);
