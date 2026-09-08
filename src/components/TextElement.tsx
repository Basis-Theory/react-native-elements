import React from 'react';
import type { TextInputProps } from 'react-native';
import type { UseTextElementProps } from './TextElement.hook';
import { useTextElement } from './TextElement.hook';
import MaskInput from 'react-native-mask-input';

type TextInputSupportedProps =
  | 'autoComplete'
  | 'editable'
  | 'enterKeyHint'
  | 'inputAccessoryViewID'
  | 'keyboardType'
  | 'maxLength'
  | 'placeholder'
  | 'placeholderTextColor'
  | 'returnKeyType'
  | 'secureTextEntry'
  | 'style'
  | 'textContentType';

type TextElementProps = UseTextElementProps &
  Pick<TextInputProps, TextInputSupportedProps>;

export const TextElement = ({
  autoComplete,
  btRef,
  editable,
  enterKeyHint,
  inputAccessoryViewID,
  keyboardType,
  mask,
  maxLength,
  onChange,
  onBlur,
  onFocus,
  onSubmitEditing,
  placeholder,
  placeholderTextColor,
  returnKeyType,
  secureTextEntry,
  style,
  textContentType,
}: TextElementProps) => {
  const {
    elementRef,
    elementValue,
    _onChange,
    _onBlur,
    _onFocus,
    _onSubmitEditing,
  } = useTextElement({
    btRef,
    onChange,
    onBlur,
    onFocus,
    onSubmitEditing,
    mask,
  });

  return (
    <MaskInput
      autoComplete={autoComplete}
      editable={editable}
      enterKeyHint={enterKeyHint}
      inputAccessoryViewID={inputAccessoryViewID}
      keyboardType={keyboardType}
      mask={mask}
      maxLength={maxLength}
      onBlur={_onBlur}
      onChangeText={_onChange}
      onFocus={_onFocus}
      onSubmitEditing={_onSubmitEditing}
      placeholder={placeholder}
      placeholderFillCharacter=""
      placeholderTextColor={placeholderTextColor}
      ref={elementRef}
      returnKeyType={returnKeyType}
      secureTextEntry={secureTextEntry}
      style={style}
      textContentType={textContentType}
      value={elementValue}
    />
  );
};
