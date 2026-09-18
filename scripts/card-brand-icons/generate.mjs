#!/usr/bin/env node

/**
 * Rasterize the card brand SVGs into the bundled RN assets.
 *
 * Metro keeps PNGs out of the JS bundle and resolves @2x/@3x by device density,
 * so this emits all three densities for the 36x24 slot CardBrandIcon renders into.
 *
 *   yarn icons:generate
 *
 * Artwork resolves override-first: svg-overrides/ wins over the synced svg/, which
 * lets a brand the web SDK ships broken be corrected here without icons:sync
 * clobbering the fix. See SOURCE.md.
 *
 * The output is committed. @resvg/resvg-js is only needed to regenerate it.
 */

import { Resvg } from '@resvg/resvg-js';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { basename, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SVG_DIR = resolve(__dirname, 'svg');
const OVERRIDE_DIR = resolve(__dirname, 'svg-overrides');
const ASSET_DIR = resolve(__dirname, '../../src/assets/card-brands');

/** Logical size of the icon slot; @2x and @3x are derived from it. */
const BASE_WIDTH = 36;
const DENSITIES = [1, 2, 3];

/**
 * Brands whose upstream artwork is unusable and that have no replacement yet.
 * Skipping them makes CardBrandIcon fall back to the generic card, which beats
 * rendering a mangled logo. Drop an entry once svg-overrides/ has real artwork.
 */
const SKIP = {};

if (!existsSync(SVG_DIR)) {
  console.error('No synced SVGs found. Run `yarn icons:sync <elements-repo>` first.');
  process.exit(1);
}

const listSvgs = (dir) =>
  existsSync(dir)
    ? readdirSync(dir)
        .filter((file) => file.endsWith('.svg'))
        .map((file) => basename(file, '.svg'))
    : [];

const overrides = new Set(listSvgs(OVERRIDE_DIR));
const brands = [...new Set([...listSvgs(SVG_DIR), ...overrides])].sort();

// Drop the previous output so brands removed upstream don't linger as orphans.
rmSync(ASSET_DIR, { force: true, recursive: true });
mkdirSync(ASSET_DIR, { recursive: true });

let totalBytes = 0;
let written = 0;

for (const brand of brands) {
  if (SKIP[brand] && !overrides.has(brand)) {
    console.log(`${brand} — skipped (${SKIP[brand]})`);
    continue;
  }

  const source = overrides.has(brand)
    ? resolve(OVERRIDE_DIR, `${brand}.svg`)
    : resolve(SVG_DIR, `${brand}.svg`);
  const svg = readFileSync(source, 'utf-8');

  for (const density of DENSITIES) {
    const png = new Resvg(svg, {
      fitTo: { mode: 'width', value: BASE_WIDTH * density },
    })
      .render()
      .asPng();

    const suffix = density === 1 ? '' : `@${density}x`;

    writeFileSync(resolve(ASSET_DIR, `${brand}${suffix}.png`), png);
    totalBytes += png.byteLength;
  }

  written += 1;
  console.log(`${brand}${overrides.has(brand) ? ' (override)' : ''}`);
}

console.log(
  `\n${written} brands x ${DENSITIES.length} densities = ${(totalBytes / 1024).toFixed(1)}KB`
);
