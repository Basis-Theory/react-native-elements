/**
 * @format
 */

import 'react-native';
import React from 'react';
import { readdirSync } from 'fs';
import { resolve } from 'path';
import { render, screen } from '@testing-library/react-native';
import { CardBrandIcon } from '../../src/components/CardBrandIcon';
import { CARD_BRANDS, type CardBrand } from '../../src/CardElementTypes';

const ASSET_DIR = resolve(__dirname, '../../src/assets/card-brands');
const DENSITIES = ['', '@2x', '@3x'];

/**
 * Brands with bundled artwork. Everything else in CARD_BRANDS falls back to `unknown`.
 * Adding a brand here without adding its PNGs fails the asset coverage test below.
 */
const BUNDLED_BRANDS: CardBrand[] = [
  'american-express',
  'cartes-bancaires',
  'diners-club',
  'discover',
  'elo',
  'hiper',
  'hipercard',
  'jcb',
  'maestro',
  'mastercard',
  'mir',
  'unionpay',
  'unknown',
  'visa',
];

const expectedAssetFor = (brand: CardBrand) =>
  BUNDLED_BRANDS.includes(brand) ? brand : 'unknown';

describe('CardBrandIcon', () => {
  test.each(CARD_BRANDS)('renders the expected asset for %s', (brand) => {
    render(<CardBrandIcon brand={brand} />);

    expect(screen.getByTestId('card-brand-icon').props.source.testUri).toContain(
      `card-brands/${expectedAssetFor(brand)}.png`
    );
  });

  test.each(CARD_BRANDS)('reports %s to screen readers', (brand) => {
    render(<CardBrandIcon brand={brand} />);

    // The detected brand is announced even when the artwork falls back, so assistive
    // tech still gets the real brand rather than "unknown".
    expect(
      screen.getByTestId('card-brand-icon').props.accessibilityLabel
    ).toMatch(/ card brand$/);
  });

  test('defaults to the unknown icon when no brand is given', () => {
    render(<CardBrandIcon />);

    expect(screen.getByTestId('card-brand-icon').props.source.testUri).toContain(
      'card-brands/unknown.png'
    );
  });

  test('every bundled brand has a generated asset at each density', () => {
    const files = readdirSync(ASSET_DIR);

    for (const brand of BUNDLED_BRANDS) {
      for (const density of DENSITIES) {
        expect(files).toContain(`${brand}${density}.png`);
      }
    }
  });

  test('ships no card brand assets that nothing renders', () => {
    const bundled = new Set<string>(BUNDLED_BRANDS);
    const orphans = readdirSync(ASSET_DIR).filter(
      (file) => !bundled.has(file.replace(/(@\dx)?\.png$/, ''))
    );

    expect(orphans).toEqual([]);
  });
});
