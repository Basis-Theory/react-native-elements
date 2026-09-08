import React from 'react';
import { type TextInputProps } from 'react-native';
import MaskInput from 'react-native-mask-input';
import type { UseCardVerificationCodeElementProps } from './CardVerificationCodeElement.hook';
import { useCardVerificationCodeElement } from './CardVerificationCodeElement.hook';

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

type CardVerificationCodeProps = UseCardVerificationCodeElementProps &
  Pick<TextInputProps, TextInputSupportedProps>;

export const CardVerificationCodeElement = ({
  autoComplete,
  btRef,
  cvcLength,
  editable,
  enterKeyHint,
  inputAccessoryViewID,
  keyboardType,
  onBlur,
  onChange,
  onFocus,
  placeholder,
  placeholderTextColor,
  returnKeyType,
  style,
  textContentType,
}: CardVerificationCodeProps) => {
  const { elementRef, elementValue, mask, _onChange, _onBlur, _onFocus } =
    useCardVerificationCodeElement({
      btRef,
      cvcLength,
      onChange,
      onBlur,
      onFocus,
    });

  return (
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
      placeholder={placeholder}
      placeholderFillCharacter=""
      placeholderTextColor={placeholderTextColor}
      ref={elementRef}
      returnKeyType={returnKeyType}
      style={style}
      textContentType={textContentType}
      value={elementValue}
    />
  );
};
