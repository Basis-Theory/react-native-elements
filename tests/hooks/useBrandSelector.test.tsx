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
    preSelectedNetworks: undefined,
    value: undefined,
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

  describe('showBrandSelector', () => {
    it('should return false when coBadgedSupport is empty', () => {
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
          coBadgedSupport: undefined,
          value: '4242424242424242',
        })
      );

      expect(result.current.showBrandSelector).toBe(false);
    });

    it('should return false when brandSelectorOptions has only one option', () => {
      const mockBinInfo = {
        brand: 'visa',
        funding: 'credit',
        issuer: { name: 'Test Bank', country: 'US' },
        segment: 'consumer',
        additional: [], // No additional brands
      };

      const { result } = renderHook(() =>
        useBrandSelector({
          ...defaultProps,
          binInfo: mockBinInfo,
          coBadgedSupport: [CoBadgedSupport.CartesBancaires],
          value: '4242424242424242',
        })
      );

      expect(result.current.showBrandSelector).toBe(false);
    });

    it('should return false when value is empty', () => {
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
          value: '',
        })
      );

      expect(result.current.showBrandSelector).toBe(false);
    });

    it('should return true when all conditions are met', () => {
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
          value: '4242424242424242',
        })
      );

      expect(result.current.showBrandSelector).toBe(true);
    });
  });

  describe('auto-select suggestedNetwork', () => {
    it('should not auto-select when preSelectedNetworks is not provided', () => {
      const mockBinInfo = {
        brand: 'visa',
        funding: 'credit',
        issuer: { name: 'Test Bank', country: 'US' },
        segment: 'consumer',
        additional: [
          { brand: 'cartes-bancaires', funding: 'credit', issuer: { name: 'Test Bank', country: 'US' } },
        ],
      };

      renderHook(() =>
        useBrandSelector({
          ...defaultProps,
          binInfo: mockBinInfo,
          coBadgedSupport: [CoBadgedSupport.CartesBancaires],
          preSelectedNetworks: undefined,
          value: '4242424242424242',
        })
      );

      expect(mockSetSelectedNetwork).not.toHaveBeenCalled();
    });

    it('should not auto-select when preSelectedNetworks is empty', () => {
      const mockBinInfo = {
        brand: 'visa',
        funding: 'credit',
        issuer: { name: 'Test Bank', country: 'US' },
        segment: 'consumer',
        additional: [
          { brand: 'cartes-bancaires', funding: 'credit', issuer: { name: 'Test Bank', country: 'US' } },
        ],
      };

      renderHook(() =>
        useBrandSelector({
          ...defaultProps,
          binInfo: mockBinInfo,
          coBadgedSupport: [CoBadgedSupport.CartesBancaires],
          preSelectedNetworks: [],
          value: '4242424242424242',
        })
      );

      expect(mockSetSelectedNetwork).not.toHaveBeenCalled();
    });

    it('should not auto-select when brandSelectorOptions has only one option', () => {
      const mockBinInfo = {
        brand: 'visa',
        funding: 'credit',
        issuer: { name: 'Test Bank', country: 'US' },
        segment: 'consumer',
        additional: [], // No additional brands
      };

      renderHook(() =>
        useBrandSelector({
          ...defaultProps,
          binInfo: mockBinInfo,
          coBadgedSupport: [CoBadgedSupport.CartesBancaires],
          preSelectedNetworks: ['visa' as CardBrand],
          value: '4242424242424242',
        })
      );

      expect(mockSetSelectedNetwork).not.toHaveBeenCalled();
    });

    it('should auto-select first matching network from preSelectedNetworks', () => {
      const mockBinInfo = {
        brand: 'visa',
        funding: 'credit',
        issuer: { name: 'Test Bank', country: 'US' },
        segment: 'consumer',
        additional: [
          { brand: 'cartes-bancaires', funding: 'credit', issuer: { name: 'Test Bank', country: 'US' } },
        ],
      };

      renderHook(() =>
        useBrandSelector({
          ...defaultProps,
          binInfo: mockBinInfo,
          coBadgedSupport: [CoBadgedSupport.CartesBancaires],
          preSelectedNetworks: ['cartes-bancaires' as CardBrand, 'visa' as CardBrand],
          value: '4242424242424242',
        })
      );

      expect(mockSetSelectedNetwork).toHaveBeenCalledWith('cartes-bancaires');
    });

    it('should skip networks not in brandSelectorOptions when auto-selecting', () => {
      const mockBinInfo = {
        brand: 'visa',
        funding: 'credit',
        issuer: { name: 'Test Bank', country: 'US' },
        segment: 'consumer',
        additional: [
          { brand: 'cartes-bancaires', funding: 'credit', issuer: { name: 'Test Bank', country: 'US' } },
        ],
      };

      renderHook(() =>
        useBrandSelector({
          ...defaultProps,
          binInfo: mockBinInfo,
          coBadgedSupport: [CoBadgedSupport.CartesBancaires],
          preSelectedNetworks: ['mastercard' as CardBrand, 'visa' as CardBrand], // mastercard not available
          value: '4242424242424242',
        })
      );

      expect(mockSetSelectedNetwork).toHaveBeenCalledWith('visa');
    });

    it('should not auto-select when showBrandSelector is false (empty value)', () => {
      const mockBinInfo = {
        brand: 'visa',
        funding: 'credit',
        issuer: { name: 'Test Bank', country: 'US' },
        segment: 'consumer',
        additional: [
          { brand: 'cartes-bancaires', funding: 'credit', issuer: { name: 'Test Bank', country: 'US' } },
        ],
      };

      renderHook(() =>
        useBrandSelector({
          ...defaultProps,
          binInfo: mockBinInfo,
          coBadgedSupport: [CoBadgedSupport.CartesBancaires],
          preSelectedNetworks: ['cartes-bancaires' as CardBrand],
          selectedNetwork: undefined,
          value: '', // Empty value means showBrandSelector is false
        })
      );

      expect(mockSetSelectedNetwork).not.toHaveBeenCalled();
    });

    it('should not auto-select when selectedNetwork is already set', () => {
      const mockBinInfo = {
        brand: 'visa',
        funding: 'credit',
        issuer: { name: 'Test Bank', country: 'US' },
        segment: 'consumer',
        additional: [
          { brand: 'cartes-bancaires', funding: 'credit', issuer: { name: 'Test Bank', country: 'US' } },
        ],
      };

      renderHook(() =>
        useBrandSelector({
          ...defaultProps,
          binInfo: mockBinInfo,
          coBadgedSupport: [CoBadgedSupport.CartesBancaires],
          preSelectedNetworks: ['cartes-bancaires' as CardBrand],
          selectedNetwork: 'visa' as CardBrand,
          value: '4242424242424242',
        })
      );

      expect(mockSetSelectedNetwork).not.toHaveBeenCalled();
    });
  });

  describe('manual selection via onNetworkSelect', () => {
    it('should return onNetworkSelect handler', () => {
      const { result } = renderHook(() =>
        useBrandSelector({
          ...defaultProps,
        })
      );

      expect(result.current.onNetworkSelect).toBeDefined();
      expect(typeof result.current.onNetworkSelect).toBe('function');
    });

    it('should call setSelectedNetwork when onNetworkSelect is called', () => {
      const { result } = renderHook(() =>
        useBrandSelector({
          ...defaultProps,
        })
      );

      result.current.onNetworkSelect('visa' as CardBrand);

      expect(mockSetSelectedNetwork).toHaveBeenCalledWith('visa');
    });

    it('should not auto-select after manual selection even when binInfo refetches', () => {
      const mockBinInfo = {
        brand: 'visa',
        funding: 'credit',
        issuer: { name: 'Test Bank', country: 'US' },
        segment: 'consumer',
        additional: [
          { brand: 'cartes-bancaires', funding: 'credit', issuer: { name: 'Test Bank', country: 'US' } },
        ],
      };

      const { result, rerender } = renderHook(
        ({ binInfo, selectedNetwork, value }) =>
          useBrandSelector({
            ...defaultProps,
            binInfo,
            coBadgedSupport: [CoBadgedSupport.CartesBancaires],
            preSelectedNetworks: ['cartes-bancaires' as CardBrand],
            selectedNetwork,
            value,
          }),
        {
          initialProps: {
            binInfo: mockBinInfo as typeof mockBinInfo | undefined,
            selectedNetwork: undefined as CardBrand | undefined,
            value: '4242424242424242',
          },
        }
      );

      // Auto-select should fire initially
      expect(mockSetSelectedNetwork).toHaveBeenCalledWith('cartes-bancaires');
      mockSetSelectedNetwork.mockClear();

      // User manually selects visa
      result.current.onNetworkSelect('visa' as CardBrand);
      expect(mockSetSelectedNetwork).toHaveBeenCalledWith('visa');
      mockSetSelectedNetwork.mockClear();

      // Simulate binInfo being cleared (e.g., API hiccup)
      rerender({
        binInfo: undefined,
        selectedNetwork: 'visa' as CardBrand,
        value: '4242424242424242',
      });

      // Reset effect clears selectedNetwork
      expect(mockSetSelectedNetwork).toHaveBeenCalledWith(undefined);
      mockSetSelectedNetwork.mockClear();

      // BinInfo comes back
      rerender({
        binInfo: mockBinInfo,
        selectedNetwork: undefined,
        value: '4242424242424242',
      });

      // Auto-select should NOT fire because user had manual selection
      expect(mockSetSelectedNetwork).not.toHaveBeenCalled();
    });

    it('should reset manual selection flag when value is cleared', () => {
      const mockBinInfo = {
        brand: 'visa',
        funding: 'credit',
        issuer: { name: 'Test Bank', country: 'US' },
        segment: 'consumer',
        additional: [
          { brand: 'cartes-bancaires', funding: 'credit', issuer: { name: 'Test Bank', country: 'US' } },
        ],
      };

      const { result, rerender } = renderHook(
        ({ binInfo, selectedNetwork, value }) =>
          useBrandSelector({
            ...defaultProps,
            binInfo,
            coBadgedSupport: [CoBadgedSupport.CartesBancaires],
            preSelectedNetworks: ['cartes-bancaires' as CardBrand],
            selectedNetwork,
            value,
          }),
        {
          initialProps: {
            binInfo: mockBinInfo as typeof mockBinInfo | undefined,
            selectedNetwork: undefined as CardBrand | undefined,
            value: '4242424242424242',
          },
        }
      );

      // Auto-select fires initially
      expect(mockSetSelectedNetwork).toHaveBeenCalledWith('cartes-bancaires');
      mockSetSelectedNetwork.mockClear();

      // User manually selects visa
      result.current.onNetworkSelect('visa' as CardBrand);
      mockSetSelectedNetwork.mockClear();

      // User clears the input (value becomes empty)
      rerender({
        binInfo: undefined,
        selectedNetwork: undefined,
        value: '',
      });

      mockSetSelectedNetwork.mockClear();

      // User types again - auto-select should work since manual flag was reset
      rerender({
        binInfo: mockBinInfo,
        selectedNetwork: undefined,
        value: '4242424242424242',
      });

      expect(mockSetSelectedNetwork).toHaveBeenCalledWith('cartes-bancaires');
    });
  });

  describe('Bancontact and Dankort support', () => {
    it('should include Bancontact brand when in coBadgedSupport', () => {
      const mockBinInfo = {
        brand: 'visa',
        funding: 'credit',
        issuer: { name: 'Test Bank', country: 'BE' },
        segment: 'consumer',
        additional: [
          { brand: 'bancontact', funding: 'debit', issuer: { name: 'Test Bank', country: 'BE' } },
        ],
      };

      const { result } = renderHook(() =>
        useBrandSelector({
          ...defaultProps,
          binInfo: mockBinInfo,
          coBadgedSupport: [CoBadgedSupport.Bancontact],
        })
      );

      expect(result.current.brandSelectorOptions).toContain('bancontact');
      expect(result.current.brandSelectorOptions).toContain('visa');
    });

    it('should include Dankort brand when in coBadgedSupport', () => {
      const mockBinInfo = {
        brand: 'visa',
        funding: 'credit',
        issuer: { name: 'Test Bank', country: 'DK' },
        segment: 'consumer',
        additional: [
          { brand: 'dankort', funding: 'debit', issuer: { name: 'Test Bank', country: 'DK' } },
        ],
      };

      const { result } = renderHook(() =>
        useBrandSelector({
          ...defaultProps,
          binInfo: mockBinInfo,
          coBadgedSupport: [CoBadgedSupport.Dankort],
        })
      );

      expect(result.current.brandSelectorOptions).toContain('dankort');
      expect(result.current.brandSelectorOptions).toContain('visa');
    });

    it('should support multiple co-badge networks', () => {
      const mockBinInfo = {
        brand: 'visa',
        funding: 'credit',
        issuer: { name: 'Test Bank', country: 'FR' },
        segment: 'consumer',
        additional: [
          { brand: 'cartes-bancaires', funding: 'credit', issuer: { name: 'Test Bank', country: 'FR' } },
          { brand: 'bancontact', funding: 'debit', issuer: { name: 'Test Bank', country: 'BE' } },
        ],
      };

      const { result } = renderHook(() =>
        useBrandSelector({
          ...defaultProps,
          binInfo: mockBinInfo,
          coBadgedSupport: [CoBadgedSupport.CartesBancaires, CoBadgedSupport.Bancontact],
        })
      );

      expect(result.current.brandSelectorOptions).toContain('visa');
      expect(result.current.brandSelectorOptions).toContain('cartes-bancaires');
      expect(result.current.brandSelectorOptions).toContain('bancontact');
    });
  });
});