#!/usr/bin/env node

/**
 * Sync card brand SVGs from basistheory-elements.
 *
 * Elements stores each brand as a TypeScript module exporting `{ viewBox, paths }`
 * (packages/elements/src/shared/icons/brands/{inline,lazy}). This reads those modules
 * out of a local checkout and writes standalone .svg files here, so the RN icons are
 * generated from the same artwork the web SDK ships rather than sourced by hand.
 *
 *   yarn icons:sync ../basistheory-elements
 *
 * Run `yarn icons:generate` afterwards to re-rasterize the PNGs.
 */

import { execFileSync } from 'child_process';
import { existsSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from 'fs';
import { basename, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, 'svg');
const SOURCE_DOC = resolve(__dirname, 'SOURCE.md');

const BRANDS_SUBPATH = 'packages/elements/src/shared/icons/brands';

/** Elements module name -> CardBrand value in src/CardElementTypes.ts */
const BRAND_NAMES = {
  amex: 'american-express',
  default: 'unknown',
  diners: 'diners-club',
};

const elementsRoot = resolve(
  process.argv[2] ?? process.env.ELEMENTS_REPO ?? '../basistheory-elements'
);
const brandsDir = resolve(elementsRoot, BRANDS_SUBPATH);

if (!existsSync(brandsDir)) {
  console.error(`Could not find ${BRANDS_SUBPATH} under ${elementsRoot}`);
  console.error('Pass the path to a basistheory-elements checkout:');
  console.error('  yarn icons:sync ../basistheory-elements');
  process.exit(1);
}

const readBrandModules = (tier) => {
  const dir = resolve(brandsDir, tier);

  return readdirSync(dir)
    .filter((file) => file.endsWith('.ts') && !file.endsWith('.test.ts'))
    .map((file) => {
      const source = readFileSync(resolve(dir, file), 'utf-8');
      const viewBox = source.match(/viewBox:\s*['"]([^'"]+)['"]/);
      const paths = source.match(/paths:\s*`([^`]+)`/s);

      if (!viewBox || !paths) {
        console.error(`Failed to parse ${tier}/${file}`);
        process.exit(1);
      }

      const name = basename(file, '.ts');

      return {
        brand: BRAND_NAMES[name] ?? name,
        viewBox: viewBox[1],
        paths: paths[1].trim(),
      };
    });
};

const brands = [...readBrandModules('inline'), ...readBrandModules('lazy')].sort(
  (a, b) => a.brand.localeCompare(b.brand)
);

for (const file of readdirSync(OUT_DIR).filter((file) =>
  file.endsWith('.svg')
)) {
  unlinkSync(resolve(OUT_DIR, file));
}

for (const { brand, viewBox, paths } of brands) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${paths}</svg>\n`;

  writeFileSync(resolve(OUT_DIR, `${brand}.svg`), svg);
  console.log(`${brand}.svg`);
}

const commit = execFileSync('git', ['rev-parse', 'HEAD'], {
  cwd: elementsRoot,
  encoding: 'utf-8',
}).trim();

writeFileSync(
  SOURCE_DOC,
  `# Card brand icon source

These SVGs are generated, not authored here. They are synced from the web SDK so both
SDKs render identical artwork.

| | |
| --- | --- |
| Repository | \`Basis-Theory/basistheory-elements\` |
| Path | \`${BRANDS_SUBPATH}/{inline,lazy}\` |
| Commit | \`${commit}\` |
| Brands | ${brands.length} |

## Updating

\`\`\`sh
yarn icons:sync /path/to/basistheory-elements   # refresh svg/ from a local checkout
yarn icons:generate                             # re-rasterize src/assets/card-brands
\`\`\`

Commit the regenerated PNGs — \`@resvg/resvg-js\` is only needed to regenerate them,
never to build or consume the SDK.

Brands absent from the web SDK (including \`mir\`, \`bancontact\` and \`dankort\`) fall
back to the \`unknown\` icon, matching what web renders for them today.
`
);

console.log(`\nSynced ${brands.length} brands from ${commit.slice(0, 7)}`);
