# Basis Theory React Native SDK

[Documentation](https://developers.basistheory.com/docs/sdks/mobile/react-native/)

## Card brand icons

`CardNumberElement` can display a bundled card-brand icon on either side of the
input. Icons are hidden by default for backward compatibility.

```tsx
<CardNumberElement
  iconPosition="right"
  iconStyle={{ width: 42, height: 28 }}
  iconContainerStyle={{ paddingLeft: 8, borderRadius: 4 }}
/>
```

Set `iconPosition` to `left`, `right`, or `none`. When co-badged card support is
enabled, the positioned icon becomes the network selector. An explicit `none`
hides both the icon and built-in selector without disabling co-badge validation
or preselected networks. If `iconPosition` is omitted, the existing text-based
co-badge picker remains available.

Icons ship as bundled PNGs at `@1x`/`@2x`/`@3x`. Brands with no artwork —
including `bancontact` and `dankort` — fall back to a generic card icon while
still reporting the detected brand through `onChange` and to screen readers.

Artwork is derived from the Basis Theory Web SDK's brand icons, except for
UnionPay, Hipercard, Hiper and MIR, which come from Wikimedia Commons
([UnionPay](https://commons.wikimedia.org/wiki/File:UnionPay_logo.svg) and
[Hipercard](https://commons.wikimedia.org/wiki/File:Hipercard_logo.svg), public
domain; [MIR](https://commons.wikimedia.org/wiki/File:Mir-logo.SVG.svg), public
domain; [Hiper](https://commons.wikimedia.org/wiki/File:Cart%C3%A3o_Hiper.jpg),
CC0, Banco Itaú Unibanco).
