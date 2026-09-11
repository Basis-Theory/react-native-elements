import React from 'react';
import type { TextInputProps } from 'react-native';
import MaskInput from 'react-native-mask-input';
import type { UseCardExpirationDateElementProps } from './CardExpirationDateElement.hook';
import { useCardExpirationDateElement } from './CardExpirationDateElement.hook';

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

type CardExpirationDateProps = UseCardExpirationDateElementProps &
  Pick<TextInputProps, TextInputSupportedProps>;

export const CardExpirationDateElement = ({
  autoComplete,
  btRef,
  editable,
  enterKeyHint,
  inputAccessoryViewID,
  keyboardType,
  onBlur,
  onChange,
  onFocus,
  onSubmitEditing,
  placeholder,
  placeholderTextColor,
  returnKeyType,
  style,
  textContentType,
}: CardExpirationDateProps) => {
  const {
    elementRef,
    _onChange,
    _onBlur,
    _onFocus,
    _onSubmitEditing,
    elementValue,
    mask,
  } = useCardExpirationDateElement({
    btRef,
    onBlur,
    onChange,
    onFocus,
    onSubmitEditing,
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
  );
};
