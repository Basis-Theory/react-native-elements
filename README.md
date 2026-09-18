# Basis Theory React Native SDK

[Documentation](https://developers.basistheory.com/docs/sdks/mobile/react-native/)

## Card brand icons

`CardNumberElement` can display a bundled card-brand icon on either side of the
input. Icons are hidden by default for backward compatibility.

```tsx
<CardNumberElement iconPosition="right" />
```

Set `iconPosition` to `left`, `right`, or `none`. When co-badged card support is
enabled, the positioned icon becomes the network selector.

`none` hides the icon. It does not hide a network selection the card actually
requires: when co-badge support is enabled and a card matches more than one
network, the text-based picker still appears, because `network_not_selected`
would otherwise be unresolvable. Omitting `iconPosition` behaves the same way.

Icons ship as bundled PNGs at `@1x`/`@2x`/`@3x` and render at a fixed 36x24
inside the field. Brands with no artwork fall back to a generic card icon while
still reporting the detected brand through `onChange` and to screen readers.

Artwork is derived from the Basis Theory Web SDK's brand icons, except for the
following, which come from Wikimedia Commons and are public domain (logos remain
trademarks of their respective networks):
[UnionPay](https://commons.wikimedia.org/wiki/File:UnionPay_logo.svg),
[Hipercard](https://commons.wikimedia.org/wiki/File:Hipercard_logo.svg),
[MIR](https://commons.wikimedia.org/wiki/File:Mir-logo.SVG.svg),
[Hiper](https://commons.wikimedia.org/wiki/File:Cart%C3%A3o_Hiper.jpg) (CC0,
Banco Itaú Unibanco),
[Bancontact](https://commons.wikimedia.org/wiki/File:Bancontact_logo_2021.svg)
and [Dankort](https://commons.wikimedia.org/wiki/File:Dankort_logo.png).
