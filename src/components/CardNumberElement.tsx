import React from 'react';
import {
  type ImageStyle,
  type StyleProp,
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
  | 'editable'
  | 'keyboardType'
  | 'placeholder'
  | 'placeholderTextColor'
  | 'style';

export type CardNumberIconPosition = 'left' | 'right' | 'none';

export type CardNumberElementProps = UseCardNumberElementProps &
  Pick<TextInputProps, TextInputSupportedProps> & {
    /** Position of the built-in card brand icon. Defaults to `none`. */
    iconPosition?: CardNumberIconPosition;
    /** Styles applied to the card brand image, including size and tint. */
    iconStyle?: StyleProp<ImageStyle>;
    /** Styles applied to the container around the icon or brand selector. */
    iconContainerStyle?: StyleProp<ViewStyle>;
  };

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
  preSelectedNetworks,
  style,
  iconPosition,
  iconStyle,
  iconContainerStyle,
}: CardNumberElementProps) => {
  const {
    elementRef,
    _onChange,
    _onBlur,
    _onFocus,
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
    cardTypes,
    skipLuhnValidation,
    binLookup,
    coBadgedSupport,
    preSelectedNetworks,
  });

  const positionedIcon = iconPosition === 'left' || iconPosition === 'right';
  const displayBrand = selectedNetwork ?? cardBrand;

  const brandArea = positionedIcon ? (
    <View
      style={[styles.iconContainer, iconContainerStyle]}
      testID={`card-brand-icon-container-${iconPosition}`}
    >
      {showBrandSelector ? (
        <BrandPicker
          brands={brandSelectorOptions}
          displayBrand={displayBrand}
          iconStyle={iconStyle}
          onBrandSelect={onNetworkSelect}
          selectedBrand={selectedNetwork}
          variant="icon"
        />
      ) : (
        <CardBrandIcon brand={displayBrand} style={iconStyle} />
      )}
    </View>
  ) : null;

  return (
    <View style={positionedIcon ? styles.container : undefined}>
      {iconPosition === 'left' && brandArea}
      {iconPosition === undefined && showBrandSelector && (
        <BrandPicker
          brands={brandSelectorOptions}
          selectedBrand={selectedNetwork}
          onBrandSelect={onNetworkSelect}
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
        style={[positionedIcon && styles.input, style]}
        value={elementValue}
      />
      {iconPosition === 'right' && brandArea}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
  },
});
