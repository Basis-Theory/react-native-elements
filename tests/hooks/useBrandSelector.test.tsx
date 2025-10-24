import { renderHook } from '@testing-library/react-native';
import { useBrandSelector } from '../../src/components/shared/useBrandSelector';
import { CardBrand, CoBadgedSupport } from '../../src/CardElementTypes';
import type { BinInfo } from '../../src/CardElementTypes';

describe('useBrandSelector', () => {
  const mockSetSelectedNetwork = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const defaultProps = {
    binInfo: undefined,
    coBadgedSupport: undefined,
    selectedNetwork: undefined,
    setSelectedNetwork: mockSetSelectedNetwork,
  };


  describe('brandSelectorOptions', () => {
    it('should return empty array when binInfo is undefined', () => {
      const { result } = renderHook(() =>
        useBrandSelector({
          ...defaultProps,
          binInfo: undefined,
        })
      );

      expect(result.current.brandSelectorOptions).toEqual([]);
    });

    it('should return options with main brand when binInfo exists', () => {
      const mockBinInfo = {
        brand: 'visa',
        funding: 'credit',
        issuer: { name: 'Test Bank', country: 'US' },
        segment: 'consumer',
        additional: [],
      };

      const { result } = renderHook(() =>
        useBrandSelector({
          ...defaultProps,
          binInfo: mockBinInfo,
        })
      );

      expect(result.current.brandSelectorOptions).toContain('visa');
    });

    it('should include additional brands that are in coBadgedSupport', () => {
      const mockBinInfo = {
        brand: 'visa',
        funding: 'credit',
        issuer: { name: 'Test Bank', country: 'US' },
        segment: 'consumer',
        additional: [
          { brand: 'cartes-bancaires', funding: 'credit', issuer: { name: 'Test Bank', country: 'US' } },
        ],
      };


      const { result } = renderHook(() =>
        useBrandSelector({
          ...defaultProps,
          binInfo: mockBinInfo,
          coBadgedSupport: [CoBadgedSupport.CartesBancaires],
        })
      );

      const options = result.current.brandSelectorOptions;
      expect(options).toContain('cartes-bancaires');
      expect(options).toContain('visa');
    });

    it('should skip additional brands without brand property', () => {
      const mockBinInfo = {
        brand: 'visa',
        funding: 'credit',
        issuer: { name: 'Test Bank', country: 'US' },
        segment: 'consumer',
        additional: [
          { brand: 'cartes-bancaires', funding: 'credit', issuer: { name: 'Test Bank', country: 'US' } },
          { brand: 'discover', funding: 'credit', issuer: { name: 'Test Bank', country: 'US' } },
        ],
      };


      const { result } = renderHook(() =>
        useBrandSelector({
          ...defaultProps,
          binInfo: mockBinInfo,
          coBadgedSupport: [CoBadgedSupport.CartesBancaires],
        })
      );

      const options = result.current.brandSelectorOptions;
      expect(options).toHaveLength(2); // cartes-bancaires, visa
    });

    it('should return unique brands (no duplicates)', () => {
      const mockBinInfo = {
        brand: 'visa',
        funding: 'credit',
        issuer: { name: 'Test Bank', country: 'US' },
        segment: 'consumer',
        additional: [
          { brand: 'visa', funding: 'credit', issuer: { name: 'Test Bank', country: 'US' } }, // Duplicate of main brand
          { brand: 'mastercard', funding: 'credit', issuer: { name: 'Test Bank', country: 'US' } },
        ],
      };


      const { result } = renderHook(() =>
        useBrandSelector({
          ...defaultProps,
          binInfo: mockBinInfo,
          coBadgedSupport: [CoBadgedSupport.CartesBancaires],
        })
      );

      const options = result.current.brandSelectorOptions;
      const visaCount = options.filter(brand => brand === 'visa').length;
      expect(visaCount).toBe(1); // Should only appear once
    });
  });

  describe('selectedNetwork reset effect', () => {
    it('should call setSelectedNetwork with undefined when binInfo becomes undefined and selectedNetwork exists', () => {
      const { rerender } = renderHook(
        ({ binInfo, selectedNetwork }) =>
          useBrandSelector({
            ...defaultProps,
            binInfo,
            selectedNetwork,
          }),
        {
          initialProps: {
            binInfo: { brand: 'visa', funding: 'credit', issuer: { name: 'Test Bank', country: 'US' }, segment: 'consumer', additional: [] } as BinInfo | undefined,
            selectedNetwork: 'visa' as CardBrand,
          },
        }
      );

      // Clear binInfo
      rerender({
        binInfo: undefined,
        selectedNetwork: 'visa' as CardBrand,
      });

      expect(mockSetSelectedNetwork).toHaveBeenCalledWith(undefined);
    });

    it('should not call setSelectedNetwork when binInfo is undefined but selectedNetwork is also undefined', () => {
      renderHook(() =>
        useBrandSelector({
          ...defaultProps,
          binInfo: undefined,
          selectedNetwork: undefined,
        })
      );

      expect(mockSetSelectedNetwork).not.toHaveBeenCalled();
    });

    it('should not call setSelectedNetwork when binInfo exists', () => {
      renderHook(() =>
        useBrandSelector({
          ...defaultProps,
          binInfo: { brand: 'visa', funding: 'credit', issuer: { name: 'Test Bank', country: 'US' }, segment: 'consumer', additional: [] },
          selectedNetwork: 'visa' as CardBrand,
        })
      );

      expect(mockSetSelectedNetwork).not.toHaveBeenCalled();
    });
  });

  describe('memoization', () => {
    it('should memoize brandSelectorOptions when dependencies do not change', () => {
      const mockBinInfo = { brand: 'visa', funding: 'credit', issuer: { name: 'Test Bank', country: 'US' }, segment: 'consumer', additional: [] };

      const { result, rerender } = renderHook(
        ({ binInfo, coBadgedSupport }) =>
          useBrandSelector({
            ...defaultProps,
            binInfo,
            coBadgedSupport,
          }),
        {
          initialProps: {
            binInfo: mockBinInfo,
            coBadgedSupport: [CoBadgedSupport.CartesBancaires],
          },
        }
      );

      const firstResult = result.current.brandSelectorOptions;

      // Rerender with same props
      rerender({
        binInfo: mockBinInfo,
        coBadgedSupport: [CoBadgedSupport.CartesBancaires],
      });

      const secondResult = result.current.brandSelectorOptions;

      expect(firstResult).toEqual(secondResult); // Should have the same content
    });

    it('should recalculate brandSelectorOptions when binInfo changes', () => {
      const { result, rerender } = renderHook(
        ({ binInfo }) =>
          useBrandSelector({
            ...defaultProps,
            binInfo,
            coBadgedSupport: [CoBadgedSupport.CartesBancaires],
          }),
        {
          initialProps: {
            binInfo: { brand: 'visa', funding: 'credit', issuer: { name: 'Test Bank', country: 'US' }, segment: 'consumer', additional: [] },
          },
        }
      );

      const firstResult = result.current.brandSelectorOptions;

      // Change binInfo
      rerender({
            binInfo: { brand: 'visa', funding: 'credit', issuer: { name: 'Test Bank', country: 'US' }, segment: 'consumer', additional: [] },
      });

      const secondResult = result.current.brandSelectorOptions;

      expect(firstResult).not.toBe(secondResult); // Should be different references
    });
  });
});