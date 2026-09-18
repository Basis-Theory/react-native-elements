#!/usr/bin/env node

/**
 * Rasterize the synced card brand SVGs into the bundled RN assets.
 *
 * Metro keeps PNGs out of the JS bundle and resolves @2x/@3x by device density,
 * so this emits all three densities for the 36x24 slot CardBrandIcon renders into.
 *
 *   yarn icons:generate
 *
 * The output is committed. @resvg/resvg-js is only needed to regenerate it.
 */

import { Resvg } from '@resvg/resvg-js';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { basename, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SVG_DIR = resolve(__dirname, 'svg');
const ASSET_DIR = resolve(__dirname, '../../src/assets/card-brands');

/** Logical size of the icon slot; @2x and @3x are derived from it. */
const BASE_WIDTH = 36;
const DENSITIES = [1, 2, 3];

if (!existsSync(SVG_DIR)) {
  console.error('No synced SVGs found. Run `yarn icons:sync <elements-repo>` first.');
  process.exit(1);
}

// Drop the previous output so brands removed upstream don't linger as orphans.
rmSync(ASSET_DIR, { force: true, recursive: true });
mkdirSync(ASSET_DIR, { recursive: true });

const svgFiles = readdirSync(SVG_DIR).filter((file) => file.endsWith('.svg'));
let totalBytes = 0;

for (const file of svgFiles.sort()) {
  const brand = basename(file, '.svg');
  const svg = readFileSync(resolve(SVG_DIR, file), 'utf-8');

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

  console.log(brand);
}

console.log(
  `\n${svgFiles.length} brands x ${DENSITIES.length} densities = ${(totalBytes / 1024).toFixed(1)}KB`
);
