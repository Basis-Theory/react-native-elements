import React, { useEffect, useMemo } from 'react';
import { View, type TextInputProps, type ViewStyle } from 'react-native';
import MaskInput from 'react-native-mask-input';
import type { UseCardNumberElementProps } from './CardNumberElement.hook';
import { useCardNumberElement } from './CardNumberElement.hook';
import { CardBrand, CoBadgedSupport } from '../CardElementTypes';
import { convertApiBrandToBrand } from '../CardElementTypes/../utils/shared';
import { BrandPicker } from './BrandPicker';
import { isNilOrEmpty } from '../utils/shared';

type TextInputSupportedProps =
  | 'editable'
  | 'keyboardType'
  | 'placeholder'
  | 'placeholderTextColor'
  | 'style';

type CardNumberProps = UseCardNumberElementProps &
  Pick<TextInputProps, TextInputSupportedProps>;

export const CardNumberElement = ({
  btRef,
  cardTypes,
  onBlur,
  onChange,
  onFocus,
  keyboardType = 'numeric',
  placeholder,
  placeholderTextColor,
  editable = true,
  skipLuhnValidation,
  binLookup,
  coBadgedSupport,
  style,
}: CardNumberProps) => {
  const { 
    elementRef,
    _onChange,
    _onBlur,
    _onFocus,
    elementValue,
    mask,
    binInfo,
    selectedNetwork,
    setSelectedNetwork
  } =
    useCardNumberElement({
      btRef,
      onBlur,
      onChange,
      onFocus,
      cardTypes,
      skipLuhnValidation,
      binLookup,
      coBadgedSupport,
    });

  const hasCoBadgedSupport = !isNilOrEmpty(coBadgedSupport);

  const brandSelectorOptions = useMemo<CardBrand[]>(() => {
    if (!binInfo) return [];

    const { brand, additional } = binInfo;

    const brandOptions = new Set<CardBrand>();

    brandOptions.add(convertApiBrandToBrand(brand));
    additional?.forEach((a) => {
      if (!a.brand) return;
      const brand = convertApiBrandToBrand(a.brand);
      if (coBadgedSupport?.includes(brand as CoBadgedSupport)) {
        brandOptions.add(brand);
      }
    });
    return Array.from(brandOptions);
  }, [binInfo, coBadgedSupport]);

  useEffect(() => {
    if (!binInfo && selectedNetwork) {
      setSelectedNetwork(undefined);
    }
  }, [binInfo, selectedNetwork]);

  return (
    <View>
      {hasCoBadgedSupport && (
        <BrandPicker
          brands={brandSelectorOptions}
          selectedBrand={selectedNetwork}
          onBrandSelect={setSelectedNetwork}
          style={style as ViewStyle}
        />
      )}
      <MaskInput
        editable={editable}
        keyboardType={keyboardType}
        mask={mask}
        onBlur={_onBlur}
        onChangeText={_onChange}
        onFocus={_onFocus}
        placeholder={placeholder}
        placeholderFillCharacter=""
        placeholderTextColor={placeholderTextColor}
        ref={elementRef}
        style={style}
        value={elementValue}
      />
    </View>
  );
};
