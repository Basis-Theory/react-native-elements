import React from 'react';
import {
  StyleSheet,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import MaskInput from 'react-native-mask-input';
import type { UseCardNumberElementProps } from './CardNumberElement.hook';
import { useCardNumberElement } from './CardNumberElement.hook';
import { BrandPicker } from './BrandPicker';
import { CardBrandIcon } from './CardBrandIcon';

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

export type CardNumberIconPosition = 'left' | 'right' | 'none';

/** Gap between the field edge and the icon, matching the web SDK's 12px inset. */
const ICON_INSET = 12;
/** Breathing room between the card number and the icon. */
const ICON_GAP = 8;
/** Keep in sync with CardBrandIcon's width. */
const ICON_WIDTH = 36;
/** Horizontal room the icon needs inside the field. */
const ICON_RESERVED = ICON_INSET + ICON_WIDTH + ICON_GAP;

export type CardNumberElementProps = UseCardNumberElementProps &
  Pick<TextInputProps, TextInputSupportedProps> & {
    /** Position of the built-in card brand icon. Defaults to `none`. */
    iconPosition?: CardNumberIconPosition;
  };

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
  iconPosition,
}: CardNumberElementProps) => {
  const {
    elementRef,
    _onChange,
    _onBlur,
    _onFocus,
    _onSubmitEditing,
    elementValue,
    cardBrand,
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

  const positionedIcon = iconPosition === 'left' || iconPosition === 'right';
  const displayBrand = selectedNetwork ?? cardBrand;

  // Overlay the icon on the field rather than sitting beside it, matching the web SDK:
  // the brand area is absolutely positioned inside the input and the value is padded
  // clear of it. Caller margins move the input's box, so the overlay mirrors them.
  const inputStyle = StyleSheet.flatten(style) ?? {};
  // Style values may be percentages, 'auto' or null; only numbers can be composed here.
  const resolveEdge = (edge?: unknown, axis?: unknown, all?: unknown): number =>
    typeof edge === 'number'
      ? edge
      : typeof axis === 'number'
        ? axis
        : typeof all === 'number'
          ? all
          : 0;

  const marginTop = resolveEdge(inputStyle.marginTop, inputStyle.marginVertical, inputStyle.margin);
  const marginBottom = resolveEdge(inputStyle.marginBottom, inputStyle.marginVertical, inputStyle.margin);
  const marginLeft = resolveEdge(inputStyle.marginLeft, inputStyle.marginHorizontal, inputStyle.margin);
  const marginRight = resolveEdge(inputStyle.marginRight, inputStyle.marginHorizontal, inputStyle.margin);

  const inputInset =
    iconPosition === 'left'
      ? {
          paddingLeft:
            resolveEdge(inputStyle.paddingLeft, inputStyle.paddingHorizontal, inputStyle.padding) +
            ICON_RESERVED,
        }
      : {
          paddingRight:
            resolveEdge(inputStyle.paddingRight, inputStyle.paddingHorizontal, inputStyle.padding) +
            ICON_RESERVED,
        };

  const overlayPosition = {
    bottom: marginBottom,
    top: marginTop,
    ...(iconPosition === 'left'
      ? { left: marginLeft + ICON_INSET }
      : { right: marginRight + ICON_INSET }),
  };

  const brandArea = positionedIcon ? (
    <View
      // The plain icon must not swallow taps meant for the field; the co-badge
      // selector is interactive, so only its subtree accepts them.
      pointerEvents={showBrandSelector ? 'box-none' : 'none'}
      style={[styles.iconOverlay, overlayPosition]}
      testID={`card-brand-icon-container-${iconPosition}`}
    >
      {showBrandSelector ? (
        <BrandPicker
          brands={brandSelectorOptions}
          displayBrand={displayBrand}
          onBrandSelect={onNetworkSelect}
          selectedBrand={selectedNetwork}
          variant="icon"
        />
      ) : (
        <CardBrandIcon brand={displayBrand} />
      )}
    </View>
  ) : null;

  return (
    <View>
      {/*
        Falls back to the text selector whenever the icon slot is not hosting one.
        `showBrandSelector` is exactly the condition that raises `network_not_selected`,
        so omitting this for `iconPosition="none"` would leave that error unresolvable.
      */}
      {!positionedIcon && showBrandSelector && (
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
        style={[style, positionedIcon && inputInset]}
        textContentType={textContentType}
        value={elementValue}
      />
      {brandArea}
    </View>
  );
};

const styles = StyleSheet.create({
  iconOverlay: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
  },
});
