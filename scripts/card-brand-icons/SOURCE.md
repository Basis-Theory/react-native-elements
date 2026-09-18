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
| Overridden | `hipercard`, `mir`, `unionpay` |

## Updating

```sh
yarn icons:sync /path/to/basistheory-elements   # refresh svg/ from a local checkout
yarn icons:generate                             # re-rasterize src/assets/card-brands
```

Commit the regenerated PNGs — `@resvg/resvg-js` is only needed to regenerate them,
never to build or consume the SDK.

## Overrides

`svg-overrides/` holds artwork that does not come from the web SDK, either because the
web SDK's copy is broken or because it has none. Delete an override once the web SDK
ships correct artwork for that brand, so it tracks upstream again.

| Brand | Why | Local source |
| --- | --- | --- |
| `unionpay` | Upstream red panel missing; wordmark reads "Un o Pay" | Wikimedia Commons, public domain |
| `hipercard` | Upstream wordmark reduced to "H˙ d" | Wikimedia Commons, public domain |
| `mir` | No upstream artwork | Wikimedia Commons, public domain |
| `hiper` | Upstream file is byte-identical to the broken `hipercard` | none — skipped, falls back to `unknown` |

Brands with neither upstream artwork nor an override (`bancontact`, `dankort` and the
rare brands) fall back to the `unknown` icon, matching what web renders for them today.
