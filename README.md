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
