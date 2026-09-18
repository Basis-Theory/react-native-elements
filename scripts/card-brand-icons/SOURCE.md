# Card brand icon source

These SVGs are generated, not authored here. `svg/` is synced from the web SDK so both
SDKs render identical artwork; `svg-overrides/` holds local corrections that survive a
sync and win during `icons:generate`.

| | |
| --- | --- |
| Repository | `Basis-Theory/basistheory-elements` |
| Path | `packages/elements/src/shared/icons/brands/{inline,lazy}` |
| Commit | `c8f29e0d036085193c2a539c558950217799fa16` |
| Synced brands | 13 |
| Overridden | `hipercard`, `unionpay` |

## Updating

```sh
yarn icons:sync /path/to/basistheory-elements   # refresh svg/ from a local checkout
yarn icons:generate                             # re-rasterize src/assets/card-brands
```

Commit the regenerated PNGs — `@resvg/resvg-js` is only needed to regenerate them,
never to build or consume the SDK.

## Overrides

The web SDK ships three brand SVGs with glyph paths dropped by an optimization step.
`svg-overrides/` replaces them until that is fixed upstream, at which point the
override should be deleted so the brand tracks the web SDK again.

| Brand | Upstream defect | Local source |
| --- | --- | --- |
| `unionpay` | Red panel missing; wordmark reads "Un o Pay" | Wikimedia Commons, public domain |
| `hipercard` | Wordmark reduced to "H˙ d" | Wikimedia Commons, public domain |
| `hiper` | Byte-identical to the broken `hipercard` file | none — skipped, falls back to `unknown` |

Brands absent from the web SDK (including `mir`, `bancontact` and `dankort`) also fall
back to the `unknown` icon, matching what web renders for them today.
