import React from 'react';
import { View, type TextInputProps, type ViewStyle } from 'react-native';
import MaskInput from 'react-native-mask-input';
import type { UseCardNumberElementProps } from './CardNumberElement.hook';
import { useCardNumberElement } from './CardNumberElement.hook';
import { BrandPicker } from './BrandPicker';

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
    selectedNetwork,
    setSelectedNetwork,
    brandSelectorOptions
  } = useCardNumberElement({
    btRef,
    onBlur,
    onChange,
    onFocus,
    cardTypes,
    skipLuhnValidation,
    binLookup,
    coBadgedSupport,
  });

  return (
    <View>
      {brandSelectorOptions.length > 1 && (
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
