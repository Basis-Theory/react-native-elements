import { type PrimitiveType } from './BaseElementTypes';
import type { BinInfo } from './CardElementTypes';
import type { CardBrand } from './CardElementTypes';

/**
 * Unified element state store. Everything related to a given element lives under the same key.
 */
const _elementState: Record<string, {
  value: PrimitiveType;
  rawValue: PrimitiveType;
  metadata: {
    binInfo?: BinInfo;
    selectedNetwork?: CardBrand;
  };
}> = {};

/**
 * `_elementErrors` are used to validate the payload before it's sent to the API. If not empty the request won't be made.
 * If these require any modification we should start looking for a better state management solution.
 */
const _elementErrors: Record<string, string | undefined> = {};

// Legacy exports for backward compatibility - these now access the unified store
const _elementValues: Record<string, PrimitiveType> = new Proxy({}, {
  get: (_, id: string) => _elementState[id]?.value,
  set: (_, id: string, value: PrimitiveType) => {
    if (!_elementState[id]) {
      _elementState[id] = { value: '', rawValue: '', metadata: {} };
    }
    _elementState[id].value = value;
    return true;
  },
  deleteProperty: (_, id: string) => {
    if (_elementState[id]) {
      delete _elementState[id];
    }
    return true;
  },
  has: (_, id: string) => id in _elementState,
  ownKeys: () => Object.keys(_elementState),
  getOwnPropertyDescriptor: (_, id: string) => {
    if (id in _elementState) {
      return {
        enumerable: true,
        configurable: true,
      };
    }
    return undefined;
  },
});

const _elementRawValues: Record<string, PrimitiveType> = new Proxy({}, {
  get: (_, id: string) => _elementState[id]?.rawValue,
  set: (_, id: string, value: PrimitiveType) => {
    if (!_elementState[id]) {
      _elementState[id] = { value: '', rawValue: '', metadata: {} };
    }
    _elementState[id].rawValue = value;
    return true;
  },
  deleteProperty: (_, id: string) => {
    if (_elementState[id]) {
      delete _elementState[id];
    }
    return true;
  },
  has: (_, id: string) => id in _elementState,
  ownKeys: () => Object.keys(_elementState),
  getOwnPropertyDescriptor: (_, id: string) => {
    if (id in _elementState) {
      return {
        enumerable: true,
        configurable: true,
      };
    }
    return undefined;
  },
});

const _elementMetadata: Record<string, {
  binInfo?: BinInfo;
  selectedNetwork?: CardBrand;
}> = new Proxy({}, {
  get: (_, id: string) => _elementState[id]?.metadata,
  set: (_, id: string, metadata: { binInfo?: BinInfo; selectedNetwork?: CardBrand }) => {
    if (!_elementState[id]) {
      _elementState[id] = { value: '', rawValue: '', metadata: {} };
    }
    _elementState[id].metadata = metadata;
    return true;
  },
  deleteProperty: (_, id: string) => {
    if (_elementState[id]) {
      delete _elementState[id];
    }
    return true;
  },
  has: (_, id: string) => id in _elementState,
  ownKeys: () => Object.keys(_elementState),
  getOwnPropertyDescriptor: (_, id: string) => {
    if (id in _elementState) {
      return {
        enumerable: true,
        configurable: true,
      };
    }
    return undefined;
  },
});

export { _elementErrors, _elementValues, _elementMetadata, _elementRawValues, _elementState };
