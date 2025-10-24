import type { Dispatch, SetStateAction } from 'react';
import { useEffect } from 'react';
import { _elementValues, _elementMetadata, _elementRawValues } from '../../ElementValues';
import { useElementEvent } from './useElementEvent';
import type { ElementType, EventConsumers } from '../../BaseElementTypes';
import type { TransformType } from './useTransform';
import { useTransform } from './useTransform';
import { ValidatorOptions } from '../../utils/validation';
import { NativeSyntheticEvent, TextInputFocusEventData } from 'react-native';
import { isString } from '../../utils/shared';
import { BinInfo, CardBrand } from '../../CardElementTypes';

type UseUserEventHandlers = {
  setElementValue: Dispatch<SetStateAction<string>>;
  element: {
    id: string;
    type: ElementType;
    validatorOptions?: ValidatorOptions;
    binLookup?: boolean;
    coBadgedSupport?: CardBrand[];
    binInfo?: BinInfo;
    selectedNetwork?: CardBrand;
    brandOptionsCount?: number;
  };
  transform?: TransformType;
} & EventConsumers;

export const useUserEventHandlers = ({
  setElementValue,
  element,
  onChange,
  onBlur,
  onFocus,
  transform,
}: UseUserEventHandlers) => {
  const createEvent = useElementEvent(element);

  const transformation = useTransform(transform);

  useEffect(() => {
    const currentState = _elementMetadata[element.id];
    const newMetadata = {
      binInfo: element.binInfo,
      selectedNetwork: element.selectedNetwork,
    };

    const hasChanged =
      currentState?.binInfo !== newMetadata.binInfo ||
      currentState?.selectedNetwork !== newMetadata.selectedNetwork;

    if (hasChanged && onChange) {
      const event = createEvent(_elementRawValues[element.id]?.toString() || '');
      onChange(event);
    }

    _elementMetadata[element.id] = {
      ...currentState,
      ...newMetadata,
    };
  }, [element.binInfo, element.selectedNetwork, onChange, createEvent, element.id]);

  return {
    _onChange: (_elementValue: string) => {
      _elementRawValues[element.id] = _elementValue;
      _elementValues[element.id] = transformation.apply(_elementValue);

      setElementValue(() => {
        if (onChange) {
          const event = createEvent(_elementValue);

          onChange(event);
        }

        return _elementValue;
      });
    },
    _onFocus: (_event: NativeSyntheticEvent<TextInputFocusEventData>) => {
      const val = _elementValues[element.id] ?? '';

      if (onFocus && isString(val)) {
        const event = createEvent(val);
        onFocus(event);
      }
    },
    _onBlur: (_event: NativeSyntheticEvent<TextInputFocusEventData>) => {
      const val = _elementValues[element.id] ?? '';

      if (onBlur && isString(val)) {
        const event = createEvent(val);
        onBlur(event);
      }
    },
    _onReady: () => {
      // TODO
    },
    _onKeydown: () => {
      // TODO
    },
  };
};
