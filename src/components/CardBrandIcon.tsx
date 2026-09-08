import React from 'react';
import {
  Image,
  type ImageStyle,
  type StyleProp,
  StyleSheet,
} from 'react-native';
import type { CardBrand } from '../CardElementTypes';
import { labelizeCardBrand } from '../utils/shared';

const cardBrandIcons: Record<CardBrand, number> = {
  accel: require('../assets/card-brands/accel.png'),
  bancontact: require('../assets/card-brands/bancontact.png'),
  'cartes-bancaires': require('../assets/card-brands/cartes-bancaires.png'),
  culiance: require('../assets/card-brands/culiance.png'),
  dankort: require('../assets/card-brands/dankort.png'),
  ebt: require('../assets/card-brands/ebt.png'),
  'eftpos-australia': require('../assets/card-brands/eftpos-australia.png'),
  nyce: require('../assets/card-brands/nyce.png'),
  'private-label': require('../assets/card-brands/private-label.png'),
  prop: require('../assets/card-brands/prop.png'),
  pulse: require('../assets/card-brands/pulse.png'),
  rupay: require('../assets/card-brands/rupay.png'),
  star: require('../assets/card-brands/star.png'),
  uatp: require('../assets/card-brands/uatp.png'),
  'korean-local': require('../assets/card-brands/korean-local.png'),
  visa: require('../assets/card-brands/visa.png'),
  mastercard: require('../assets/card-brands/mastercard.png'),
  'american-express': require('../assets/card-brands/american-express.png'),
  discover: require('../assets/card-brands/discover.png'),
  'diners-club': require('../assets/card-brands/diners-club.png'),
  jcb: require('../assets/card-brands/jcb.png'),
  unionpay: require('../assets/card-brands/unionpay.png'),
  maestro: require('../assets/card-brands/maestro.png'),
  elo: require('../assets/card-brands/elo.png'),
  hiper: require('../assets/card-brands/hiper.png'),
  hipercard: require('../assets/card-brands/hipercard.png'),
  mir: require('../assets/card-brands/mir.png'),
  unknown: require('../assets/card-brands/unknown.png'),
};

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
