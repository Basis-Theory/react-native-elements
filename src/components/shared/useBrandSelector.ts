import { useEffect, useMemo } from 'react';
import { CardBrand, CoBadgedSupport } from '../../CardElementTypes';
import { convertApiBrandToBrand } from '../../utils/shared';
import { isNilOrEmpty } from '../../utils/shared';
import type { BinInfo } from '../../CardElementTypes';

interface UseBrandSelectorProps {
  binInfo?: BinInfo;
  coBadgedSupport?: CoBadgedSupport[];
  selectedNetwork?: CardBrand;
  setSelectedNetwork: (brand: CardBrand | undefined) => void;
}

interface UseBrandSelectorReturn {
  brandSelectorOptions: CardBrand[];
}

export const useBrandSelector = ({
  binInfo,
  coBadgedSupport,
  selectedNetwork,
  setSelectedNetwork,
}: UseBrandSelectorProps): UseBrandSelectorReturn => {
  const hasCoBadgedSupport = useMemo(() => 
    !isNilOrEmpty(coBadgedSupport), 
    [coBadgedSupport]
  );

  const brandSelectorOptions = useMemo<CardBrand[]>(() => {
    if (!binInfo) return [];

    const { brand, additional } = binInfo;
    const brandOptions = new Set<CardBrand>();

    brandOptions.add(convertApiBrandToBrand(brand));
    
    additional?.forEach((a) => {
      if (!a.brand) return;
      const brand = convertApiBrandToBrand(a.brand);
      if (hasCoBadgedSupport && coBadgedSupport?.includes(brand as CoBadgedSupport)) {
        brandOptions.add(brand);
      }
    });
    
    return Array.from(brandOptions);
  }, [binInfo, coBadgedSupport]);

  // Reset selected network when binInfo is cleared
  useEffect(() => {
    if (!binInfo && selectedNetwork) {
      setSelectedNetwork(undefined);
    }
  }, [binInfo, selectedNetwork, setSelectedNetwork]);

  return {
    brandSelectorOptions,
  };
};