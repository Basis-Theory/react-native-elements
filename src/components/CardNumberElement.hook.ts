import type { CreditCardType } from '../types';
import type { ForwardedRef } from 'react';
import { useId, useRef, useState } from 'react';
import type { TextInput } from 'react-native';
import {
  ElementType,
  type BTRef,
  type EventConsumers,
} from '../BaseElementTypes';
import { useBtRef } from './shared/useBtRef';
import { useBtRefUnmount } from './shared/useBtRefUnmount';
import { useMask } from './shared/useMask';
import { useUserEventHandlers } from './shared/useUserEventHandlers';
import { useCustomBin } from './useCustomBin.hook';
import { useBinLookup } from './useBinLookup';
import { useCleanupStateBeforeUnmount } from './shared/useCleanStateOnUnmount';
import { CardBrand, CoBadgedSupport } from '../CardElementTypes';
import { useBrandSelector } from './shared/useBrandSelector';

type UseCardNumberElementProps = {
  btRef?: ForwardedRef<BTRef>;
  cardTypes?: CreditCardType[];
  skipLuhnValidation?: boolean;
  binLookup?: boolean;
  coBadgedSupport?: CoBadgedSupport[];
} & EventConsumers;

export const useCardNumberElement = ({
  btRef,
  onBlur,
  onChange,
  onFocus,
  cardTypes,
  skipLuhnValidation,
  binLookup,
  coBadgedSupport,
}: UseCardNumberElementProps) => {

  const hasCoBadgedSupport = (coBadgedSupport?.length ?? 0) > 0;

  if (hasCoBadgedSupport && coBadgedSupport) {
    const validValues = Object.values(CoBadgedSupport);
    const invalidValues = coBadgedSupport.filter(value => !validValues.includes(value));
    
    if (invalidValues.length > 0) {
      throw new Error(
        `Invalid coBadgedSupport values: ${invalidValues.join(', ')}. ` +
        `Valid values are: ${validValues.join(', ')}`
      );
    }
  }

  const id = useId();

  const type = ElementType.CARD_NUMBER;
  const elementRef = useRef<TextInput>(null);
  const [elementValue, setElementValue] = useState<string>('');
  const [selectedNetwork, setSelectedNetwork] = useState<CardBrand | undefined>(undefined);

  const binEnabled = binLookup || hasCoBadgedSupport;
  const { binInfo } = useBinLookup(binEnabled, elementValue.replaceAll(' ', ''));

  // Get brand options from useBrandSelector hook
  const { brandSelectorOptions } = useBrandSelector({
    binInfo,
    coBadgedSupport,
    selectedNetwork,
    setSelectedNetwork,
  });

  const brandOptionsCount = brandSelectorOptions.length;

  useCleanupStateBeforeUnmount(id);

  useCustomBin(cardTypes);

  useBtRefUnmount({ btRef });

  const mask = useMask({
    type,
    id,
  });

  const { _onChange, _onBlur, _onFocus } = useUserEventHandlers({
    setElementValue,
    transform: [' ', ''],
    element: {
      id,
      validatorOptions: { mask, skipLuhnValidation, coBadgedSupport },
      type,
      binLookup,
      coBadgedSupport,
      binInfo,
      selectedNetwork,
      brandOptionsCount
    },
    onChange,
    onBlur,
    onFocus,
  });

  useBtRef({
    btRef,
    elementRef,
    id,
    setElementValue,
    onChange: _onChange,
  });

  return {
    elementRef,
    elementValue,
    selectedNetwork,
    setSelectedNetwork,
    binInfo,
    brandSelectorOptions,
    _onChange,
    _onBlur,
    _onFocus,
    mask,
  };
};

export type { UseCardNumberElementProps };
