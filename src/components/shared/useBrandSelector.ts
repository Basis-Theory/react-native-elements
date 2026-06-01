import { useCallback, useEffect, useMemo, useState } from 'react';
import { CardBrand, CoBadgedSupport } from '../../CardElementTypes';
import { convertApiBrandToBrand } from '../../utils/shared';
import { isNilOrEmpty } from '../../utils/shared';
import type { BinInfo } from '../../CardElementTypes';

interface UseBrandSelectorProps {
  binInfo?: BinInfo;
  coBadgedSupport?: CoBadgedSupport[];
  selectedNetwork?: CardBrand;
  setSelectedNetwork: (brand: CardBrand | undefined) => void;
  preSelectedNetworks?: CardBrand[];
  value?: string;
}

interface UseBrandSelectorReturn {
  brandSelectorOptions: CardBrand[];
  showBrandSelector: boolean;
  onNetworkSelect: (brand: CardBrand | undefined) => void;
}

export const useBrandSelector = ({
  binInfo,
  coBadgedSupport,
  selectedNetwork,
  setSelectedNetwork,
  preSelectedNetworks,
  value,
}: UseBrandSelectorProps): UseBrandSelectorReturn => {
  // Track whether user has manually selected a network (vs auto-select)
  const [hasManualSelection, setHasManualSelection] = useState(false);

  const hasCoBadgedSupport = useMemo(() =>
    !isNilOrEmpty(coBadgedSupport),
    [coBadgedSupport]
  );

  const brandSelectorOptions = useMemo<CardBrand[]>(() => {
    if (!binInfo) return [];

    const { brand, additional } = binInfo;
    const brandOptions = new Set<CardBrand>();

    if (brand) {
      brandOptions.add(convertApiBrandToBrand(brand));
    }

    additional?.forEach((a) => {
      if (!a.brand) return;
      const brand = convertApiBrandToBrand(a.brand);
      if (hasCoBadgedSupport && coBadgedSupport?.includes(brand as CoBadgedSupport)) {
        brandOptions.add(brand);
      }
    });

    return Array.from(brandOptions);
  }, [binInfo, coBadgedSupport, hasCoBadgedSupport]);

  const showBrandSelector = useMemo(() =>
    hasCoBadgedSupport &&
    brandSelectorOptions.length > 1 &&
    !isNilOrEmpty(value),
    [hasCoBadgedSupport, brandSelectorOptions.length, value]
  );

  const suggestedNetwork = useMemo<CardBrand | undefined>(() => {
    if (
      preSelectedNetworks &&
      preSelectedNetworks.length > 0 &&
      brandSelectorOptions.length > 1
    ) {
      // Find the first network from preSelectedNetworks that exists in available options
      return preSelectedNetworks.find((network) =>
        brandSelectorOptions.includes(network)
      );
    }
    return undefined;
  }, [brandSelectorOptions, preSelectedNetworks]);

  // Handler for manual network selection from UI
  const onNetworkSelect = useCallback((brand: CardBrand | undefined) => {
    if (brand !== undefined) {
      setHasManualSelection(true);
    }
    setSelectedNetwork(brand);
  }, [setSelectedNetwork]);

  // Auto-select suggested network when available, picker is visible, and no manual selection
  useEffect(() => {
    if (showBrandSelector && suggestedNetwork && !selectedNetwork && !hasManualSelection) {
      setSelectedNetwork(suggestedNetwork);
    }
  }, [showBrandSelector, suggestedNetwork, selectedNetwork, setSelectedNetwork, hasManualSelection]);

  // Reset selected network when binInfo is cleared
  useEffect(() => {
    if (!binInfo && selectedNetwork) {
      setSelectedNetwork(undefined);
    }
  }, [binInfo, selectedNetwork, setSelectedNetwork]);

  // Reset manual selection flag when value is cleared (user started over)
  useEffect(() => {
    if (isNilOrEmpty(value)) {
      setHasManualSelection(false);
    }
  }, [value]);

  return {
    brandSelectorOptions,
    showBrandSelector,
    onNetworkSelect,
  };
};