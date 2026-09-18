# Card brand icon source

These SVGs are generated, not authored here. They are synced from the web SDK so both
SDKs render identical artwork.

| | |
| --- | --- |
| Repository | `Basis-Theory/basistheory-elements` |
| Path | `packages/elements/src/shared/icons/brands/{inline,lazy}` |
| Commit | `c8f29e0d036085193c2a539c558950217799fa16` |
| Brands | 13 |

## Updating

```sh
yarn icons:sync /path/to/basistheory-elements   # refresh svg/ from a local checkout
yarn icons:generate                             # re-rasterize src/assets/card-brands
```

Commit the regenerated PNGs — `@resvg/resvg-js` is only needed to regenerate them,
never to build or consume the SDK.

Brands absent from the web SDK (including `mir`, `bancontact` and `dankort`) fall
back to the `unknown` icon, matching what web renders for them today.
