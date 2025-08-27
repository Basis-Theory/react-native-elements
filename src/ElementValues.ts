import { type PrimitiveType } from './BaseElementTypes';
import type { BinInfo } from './CardElementTypes';
import type { CardBrand } from './CardElementTypes';

/**
 * If `_elementValues` requires any modification, we should start looking for a better state management solution.
 */
const _elementValues: Record<string, PrimitiveType> = {};

/**
 * If `_elementRawValues` are used to store the raw value of the element.
 */
const _elementRawValues: Record<string, PrimitiveType> = {};

/**
 * If `_elementMetadata` are used to store the metadata of the element.
 */
const _elementMetadata: Record<string, {
    binInfo?: BinInfo;
    selectedNetwork?: CardBrand;
}> = {};

/**
 * `_elementErrors` are used to validate the payload before it's sent to the API. If not empty the request won't be made.
 * If these require any modification we should start looking for a better state management solution.
 */
const _elementErrors: Record<string, string | undefined> = {};

export { _elementErrors, _elementValues, _elementMetadata, _elementRawValues };
