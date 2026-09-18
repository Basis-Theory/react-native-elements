import React from 'react';
import {
  Image,
  type ImageStyle,
  type StyleProp,
  StyleSheet,
} from 'react-native';
import type { CardBrand } from '../CardElementTypes';
import { labelizeCardBrand } from '../utils/shared';

/*
 * Assets are rasterized from the web SDK's brand SVGs so both SDKs render identical
 * artwork — see scripts/card-brand-icons. Brands the web SDK has no artwork for fall
 * back to `unknown`, matching what it displays for them.
 */
/* eslint-disable @typescript-eslint/no-var-requires -- Metro requires static require calls for bundled images. */
const cardBrandIcons: Partial<Record<CardBrand, number>> = {
  'american-express': require('../assets/card-brands/american-express.png'),
  'cartes-bancaires': require('../assets/card-brands/cartes-bancaires.png'),
  'diners-club': require('../assets/card-brands/diners-club.png'),
  discover: require('../assets/card-brands/discover.png'),
  elo: require('../assets/card-brands/elo.png'),
  hiper: require('../assets/card-brands/hiper.png'),
  hipercard: require('../assets/card-brands/hipercard.png'),
  jcb: require('../assets/card-brands/jcb.png'),
  maestro: require('../assets/card-brands/maestro.png'),
  mastercard: require('../assets/card-brands/mastercard.png'),
  unionpay: require('../assets/card-brands/unionpay.png'),
  unknown: require('../assets/card-brands/unknown.png'),
  visa: require('../assets/card-brands/visa.png'),
};
/* eslint-enable @typescript-eslint/no-var-requires */

export type CardBrandIconProps = {
  brand?: CardBrand;
  style?: StyleProp<ImageStyle>;
  testID?: string;
};

export const CardBrandIcon = ({
  brand = 'unknown',
  style,
  testID = 'card-brand-icon',
}: CardBrandIconProps) => (
  <Image
    accessibilityLabel={`${labelizeCardBrand(brand)} card brand`}
    resizeMode="contain"
    source={cardBrandIcons[brand] ?? cardBrandIcons.unknown}
    style={[styles.icon, style]}
    testID={testID}
  />
);

const styles = StyleSheet.create({
  icon: {
    height: 24,
    width: 36,
  },
});
