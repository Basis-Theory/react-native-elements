import React from 'react';
import { View, type TextInputProps, type ViewStyle } from 'react-native';
import MaskInput from 'react-native-mask-input';
import type { UseCardNumberElementProps } from './CardNumberElement.hook';
import { useCardNumberElement } from './CardNumberElement.hook';
import { BrandPicker } from './BrandPicker';

type TextInputSupportedProps =
  | 'autoComplete'
  | 'editable'
  | 'enterKeyHint'
  | 'inputAccessoryViewID'
  | 'keyboardType'
  | 'placeholder'
  | 'placeholderTextColor'
  | 'returnKeyType'
  | 'style'
  | 'textContentType';

type CardNumberProps = UseCardNumberElementProps &
  Pick<TextInputProps, TextInputSupportedProps>;

export const CardNumberElement = ({
  autoComplete,
  btRef,
  cardTypes,
  onBlur,
  onChange,
  onFocus,
  onSubmitEditing,
  enterKeyHint,
  inputAccessoryViewID,
  keyboardType = 'numeric',
  placeholder,
  placeholderTextColor,
  editable = true,
  skipLuhnValidation,
  binLookup,
  coBadgedSupport,
  preSelectedNetworks,
  returnKeyType,
  style,
  textContentType,
}: CardNumberProps) => {
  const {
    elementRef,
    _onChange,
    _onBlur,
    _onFocus,
    _onSubmitEditing,
    elementValue,
    mask,
    selectedNetwork,
    onNetworkSelect,
    brandSelectorOptions,
    showBrandSelector,
  } = useCardNumberElement({
    btRef,
    onBlur,
    onChange,
    onFocus,
    onSubmitEditing,
    cardTypes,
    skipLuhnValidation,
    binLookup,
    coBadgedSupport,
    preSelectedNetworks,
  });

  return (
    <View>
      {showBrandSelector && (
        <BrandPicker
          brands={brandSelectorOptions}
          selectedBrand={selectedNetwork}
          onBrandSelect={onNetworkSelect}
          style={style as ViewStyle}
        />
      )}
      <MaskInput
        autoComplete={autoComplete}
        editable={editable}
        enterKeyHint={enterKeyHint}
        inputAccessoryViewID={inputAccessoryViewID}
        keyboardType={keyboardType}
        mask={mask}
        onBlur={_onBlur}
        onChangeText={_onChange}
        onFocus={_onFocus}
        onSubmitEditing={_onSubmitEditing}
        placeholder={placeholder}
        placeholderFillCharacter=""
        placeholderTextColor={placeholderTextColor}
        ref={elementRef}
        returnKeyType={returnKeyType}
        style={style}
        textContentType={textContentType}
        value={elementValue}
      />
    </View>
  );
};
