import type { Dispatch, SetStateAction } from 'react';
import { useEffect, useRef } from 'react';
import { _elementValues } from '../../ElementValues';
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
    selectedNetwork?: CardBrand
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
  const prevBinInfoRef = useRef<BinInfo | undefined>(element.binInfo);
  const prevValueRef = useRef<string>('');
  const prevSelectedNetworkRef = useRef<CardBrand | undefined>(element.selectedNetwork);


  useEffect(() => {
    const currentBinInfo = element.binInfo;
    const prevBinInfo = prevBinInfoRef.current;

    if (currentBinInfo !== prevBinInfo && onChange) {
      const event = createEvent(prevValueRef.current);
      onChange(event);
    }

    prevBinInfoRef.current = currentBinInfo;
  }, [element.binInfo, onChange, createEvent, element.id]);

  useEffect(() => {
    const currentSelectedNetwork = element.selectedNetwork;
    const prevSelectedNetwork = prevSelectedNetworkRef.current;

    if (currentSelectedNetwork !== prevSelectedNetwork && onChange) {
      const event = createEvent(prevValueRef.current);
      onChange(event);
    }

    prevSelectedNetworkRef.current = currentSelectedNetwork;
  }, [element.selectedNetwork, onChange, createEvent, element.id]);

  return {
    _onChange: (_elementValue: string) => {
      prevValueRef.current = _elementValue;
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
