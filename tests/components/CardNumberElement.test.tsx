/**
 * @format
 */

import { VISA, MASTERCARD } from '@basis-theory/basis-theory-js/types/elements';
import 'react-native';
import React from 'react';

import {
  render,
  userEvent,
  fireEvent,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { CardNumberElement } from '../../src';
import { BasisTheoryProvider } from '../../src/BasisTheoryProvider';
import { CoBadgedSupport } from '../../src/CardElementTypes';
import cardValidator from 'card-validator';
import * as useBinLookupModule from '../../src/components/useBinLookup';

// Mock axios for bin lookup tests
jest.mock('axios');
const mockedAxios = jest.mocked(require('axios'));

describe('CardNumberElement', () => {
  beforeEach(() => {
    cardValidator.creditCardType.resetModifications();
  });

  const mockedRef = {
    current: {
      id: '123',
      format: () => '',
      clear: () => {},
      setValue: () => {},
      focus: () => {},
      blur: () => {},
    },
  };

  describe('mask', () => {
    test('input masks card number correctly', () => {
      render(
        <CardNumberElement
          btRef={mockedRef}
          placeholder="Card Number"
          style={{}}
        />
      );

      const el = screen.getByPlaceholderText('Card Number');

      fireEvent.changeText(el, '4242424242424242');

      expect(el.props.value).toStrictEqual('4242 4242 4242 4242');
    });
  });

  describe('CustomBin', () => {
    test('validates custom bin', async () => {
      const doStuff = jest.fn();

      const { getByPlaceholderText } = render(
        <CardNumberElement
          btRef={mockedRef}
          cardTypes={[
            {
              ...VISA,
              patterns: [...VISA.patterns, 8405], // add custom bin to VISA from tabapay
            },
            MASTERCARD,
          ]}
          onChange={doStuff}
          placeholder="Card Number"
          style={{}}
        />
      );

      const el = getByPlaceholderText('Card Number');

      fireEvent.changeText(el, '8405840704999997', {});

      expect(doStuff).toHaveBeenLastCalledWith({
        empty: false,
        errors: undefined,
        valid: true,
        maskSatisfied: true,
        complete: true,
        cvcLength: 3,
        cardBin: '84058407',
        cardLast4: '9997',
        brand: 'visa',
      });
    });

    test('returns unknown for valid bin and unsuported card brand', async () => {
      const doStuff = jest.fn();

      const { getByPlaceholderText } = render(
        <CardNumberElement
          btRef={mockedRef}
          cardTypes={[VISA]}
          onChange={doStuff}
          placeholder="Card Number"
          style={{}}
        />
      );

      const el = getByPlaceholderText('Card Number');

      fireEvent.changeText(el, '5555555555554444', {});

      expect(doStuff).toHaveBeenLastCalledWith({
        empty: false,
        errors: [{ targetId: 'cardNumber', type: 'invalid' }],
        valid: false,
        maskSatisfied: true,
        complete: false,
        cvcLength: undefined,
        brand: 'unknown',
      });
    });
  });

  describe('Dynamic card lengths', () => {
    test('input masks card number correctly and emits the correct events', () => {
      const onChange = jest.fn();

      render(
        <CardNumberElement
          btRef={mockedRef}
          placeholder="Card Number"
          style={{}}
          onChange={onChange}
        />
      );

      const el = screen.getByPlaceholderText('Card Number');

      fireEvent.changeText(el, '4242424242424241');

      expect(el.props.value).toStrictEqual('4242 4242 4242 4241');

      // does not pass luhn validation and meets first mask
      expect(onChange).toHaveBeenCalledWith({
        brand: 'visa',
        cardBin: undefined, // card is not valid hence cardBin is not computed
        cardLast4: undefined, // card is not valid hence cardLast4 is not computed
        cvcLength: 3,
        complete: false,
        empty: false,
        errors: [{ targetId: 'cardNumber', type: 'invalid' }],
        maskSatisfied: true,
        valid: false,
      });

      fireEvent.changeText(el, '42424242424242414');

      expect(el.props.value).toStrictEqual('4242 4242 4242 42414');

      // does not meet next available mask
      expect(onChange).toHaveBeenCalledWith({
        brand: 'visa',
        cardBin: undefined, // card is not valid hence cardBin is not computed
        cardLast4: undefined, // card is not valid hence cardLast4 is not computed
        cvcLength: 3,
        complete: false,
        empty: false,
        errors: [{ targetId: 'cardNumber', type: 'incomplete' }],
        maskSatisfied: false,
        valid: false,
      });

      fireEvent.changeText(el, '424242424242424145');

      expect(el.props.value).toStrictEqual('4242 4242 4242 424145');

      // meets last mask but does not pass luhn validation
      expect(onChange).toHaveBeenCalledWith({
        brand: 'visa',
        cardBin: undefined, // card is not valid hence cardBin is not computed
        cardLast4: undefined, // card is not valid hence cardLast4 is not computed
        cvcLength: 3,
        complete: false,
        empty: false,
        errors: [{ targetId: 'cardNumber', type: 'invalid' }],
        maskSatisfied: true,
        valid: false,
      });
    });
  });

  describe('Validation and change events', () => {
    test.each([
      [
        'should error: incomplete',
        '4',
        {
          brand: 'unknown',
          complete: false,
          empty: false,
          errors: [{ targetId: 'cardNumber', type: 'incomplete' }],
          maskSatisfied: false,
          valid: false,
        },
        '4',
      ],
      [
        'should error: invalid',
        '4242424242424241',
        {
          brand: 'visa',
          cardBin: undefined, // card is not valid hence cardBin is not computed
          cardLast4: undefined, // card is not valid hence cardLast4 is not computed
          cvcLength: 3,
          complete: false,
          empty: false,
          errors: [{ targetId: 'cardNumber', type: 'invalid' }],
          maskSatisfied: true,
          valid: false,
        },
        '4242 4242 4242 4241',
      ],
      [
        'prevents addition of chars that do not belong to the mask',
        '#####',
        {
          brand: 'unknown',
          complete: false,
          empty: true,
          maskSatisfied: false,
          valid: false,
        },
        '',
      ],
      [
        `shouldn't error`,
        '4242424242424242',
        {
          brand: 'visa',
          cardBin: '42424242',
          cardLast4: '4242',
          complete: true,
          cvcLength: 3,
          maskSatisfied: true,
          valid: true,
          empty: false,
        },
        '4242 4242 4242 4242',
      ],
      [
        `should work when mask is re-computed (ie. 16 -> 18 digits)`,
        '424242424242424242',
        {
          complete: true,
          maskSatisfied: true,
          brand: 'visa',
          cardBin: '42424242',
          cardLast4: '4242',
          cvcLength: 3,
          valid: true,
          empty: false,
        },
        '4242 4242 4242 424242',
      ],
    ])('input: %s', async (_, inputValue, expectedEvent, expectedValue) => {
      const user = userEvent.setup();
      const onChange = jest.fn();

      render(
        <CardNumberElement
          btRef={mockedRef}
          placeholder="Card Number"
          style={{}}
          onChange={onChange}
        />
      );

      const el = screen.getByPlaceholderText('Card Number');

      await user.type(el, inputValue);

      expect(el.props.value).toStrictEqual(expectedValue);
      expect(onChange).toHaveBeenCalledWith(expectedEvent);
    });
  });

  describe('skipLuhnValidation', () => {
    test('skips luhn validation when skipLuhnValidation is true', async () => {
      const onChange = jest.fn();

      const { getByPlaceholderText } = render(
        <CardNumberElement
          btRef={mockedRef}
          skipLuhnValidation
          onChange={onChange}
          placeholder="Card Number"
          style={{}}
        />
      );

      const el = getByPlaceholderText('Card Number');

      // luhn invalid card
      fireEvent.changeText(el, '4242424242424241', {});

      expect(onChange).toHaveBeenLastCalledWith({
        empty: false,
        errors: undefined,
        valid: true,
        maskSatisfied: true,
        complete: true,
        cvcLength: 3,
        cardBin: undefined, // card validator does not compute 'card' when card is not valid
        cardLast4: undefined,
        brand: 'visa',
      });
    });
  });

  describe('OnBlur', () => {
    test('triggers event', () => {
      const onBlur = jest.fn();

      render(
        <CardNumberElement
          btRef={mockedRef}
          placeholder="Card Number"
          style={{}}
          onBlur={onBlur}
        />
      );

      const el = screen.getByPlaceholderText('Card Number');

      fireEvent(el, 'blur');

      expect(onBlur).toHaveBeenCalledWith({
        brand: 'unknown',
        cardBin: undefined,
        cardLast4: undefined,
        complete: false,
        cvcLength: undefined,
        empty: true,
        errors: undefined,
        maskSatisfied: false,
        valid: false,
      });
    });
  });

  describe('OnFocus', () => {
    test('triggers event', () => {
      const onFocus = jest.fn();

      render(
        <CardNumberElement
          btRef={mockedRef}
          placeholder="Card Number"
          style={{}}
          onFocus={onFocus}
        />
      );

      const el = screen.getByPlaceholderText('Card Number');

      fireEvent(el, 'focus');

      expect(onFocus).toHaveBeenCalledWith({
        brand: 'unknown',
        cardBin: undefined,
        cardLast4: undefined,
        complete: false,
        cvcLength: undefined,
        empty: true,
        errors: undefined,
        maskSatisfied: false,
        valid: false,
      });
    });
  });

  describe('Co-badge Support', () => {
    const mockBt = {
      config: {
        apiKey: 'test-api-key',
        apiBaseUrl: 'https://api.basistheory.com',
      },
    };

    const mockBinInfo = {
      brand: 'visa',
      funding: 'debit',
      issuer: {
        country: 'US',
        name: 'Test Bank',
      },
      segment: 'consumer',
      additional: [
        {
          brand: 'cartes-bancaires',
          funding: 'debit',
          issuer: {
            country: 'US',
            name: 'Test Bank',
          },
        },
      ],
    };

    beforeEach(() => {
      jest.clearAllMocks();
      // Mock the useBinLookup hook
      jest.spyOn(useBinLookupModule, 'useBinLookup').mockReturnValue({
        binInfo: mockBinInfo,
      });
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    test('renders BrandPicker when coBadgedSupport is provided', () => {
      const onChange = jest.fn();

      render(
        <BasisTheoryProvider bt={mockBt}>
          <CardNumberElement
            btRef={mockedRef}
            coBadgedSupport={[CoBadgedSupport.CartesBancaires]}
            onChange={onChange}
            placeholder="Card Number"
            style={{}}
          />
        </BasisTheoryProvider>
      );

      // BrandPicker should be rendered (it shows "Select card brand" when no brand is selected)
      expect(screen.getByText('Select card brand')).toBeTruthy();
    });

    test('does not render BrandPicker when coBadgedSupport is not provided', () => {
      const onChange = jest.fn();

      render(
        <BasisTheoryProvider bt={mockBt}>
          <CardNumberElement
            btRef={mockedRef}
            onChange={onChange}
            placeholder="Card Number"
            style={{}}
          />
        </BasisTheoryProvider>
      );

      // BrandPicker should not be rendered
      expect(screen.queryByText('Select card brand')).toBeNull();
    });

    test('includes selectedNetwork in onChange event when coBadgedSupport is enabled', async () => {
      const onChange = jest.fn();

      render(
        <BasisTheoryProvider bt={mockBt}>
          <CardNumberElement
            btRef={mockedRef}
            coBadgedSupport={[CoBadgedSupport.CartesBancaires]}
            onChange={onChange}
            placeholder="Card Number"
            style={{}}
          />
        </BasisTheoryProvider>
      );

      const el = screen.getByPlaceholderText('Card Number');
      fireEvent.changeText(el, '4242424242424242');

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith(
          expect.objectContaining({
            selectedNetwork: undefined, // Initially undefined
          })
        );
      });
    });

    test('does not include selectedNetwork in onChange event when coBadgedSupport is not enabled', async () => {
      const onChange = jest.fn();

      render(
        <BasisTheoryProvider bt={mockBt}>
          <CardNumberElement
            btRef={mockedRef}
            onChange={onChange}
            placeholder="Card Number"
            style={{}}
          />
        </BasisTheoryProvider>
      );

      const el = screen.getByPlaceholderText('Card Number');
      fireEvent.changeText(el, '4242424242424242');

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith(
          expect.not.objectContaining({
            selectedNetwork: expect.anything(),
          })
        );
      });
    });

    test('resets selectedNetwork when binInfo is cleared', async () => {
      const onChange = jest.fn();
      
      // Start with binInfo, then clear it
      const mockUseBinLookup = jest.spyOn(useBinLookupModule, 'useBinLookup');
      mockUseBinLookup.mockReturnValueOnce({ binInfo: mockBinInfo });

      const { rerender } = render(
        <BasisTheoryProvider bt={mockBt}>
          <CardNumberElement
            btRef={mockedRef}
            coBadgedSupport={[CoBadgedSupport.CartesBancaires]}
            onChange={onChange}
            placeholder="Card Number"
            style={{}}
          />
        </BasisTheoryProvider>
      );

      // Clear binInfo
      mockUseBinLookup.mockReturnValue({ binInfo: undefined });

      rerender(
        <BasisTheoryProvider bt={mockBt}>
          <CardNumberElement
            btRef={mockedRef}
            coBadgedSupport={[CoBadgedSupport.CartesBancaires]}
            onChange={onChange}
            placeholder="Card Number"
            style={{}}
          />
        </BasisTheoryProvider>
      );

      // Should trigger onChange with selectedNetwork reset
      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith(
          expect.objectContaining({
            selectedNetwork: undefined,
          })
        );
      });
    });
  });

  describe('Bin Lookup', () => {
    const mockBt = {
      config: {
        apiKey: 'test-api-key',
        apiBaseUrl: 'https://api.basistheory.com',
      },
    };

    const mockBinInfo = {
      brand: 'visa',
      funding: 'debit',
      issuer: {
        country: 'US',
        name: 'Test Bank',
      },
      segment: 'consumer',
      additional: [],
    };

    beforeEach(() => {
      jest.clearAllMocks();
      mockedAxios.mockResolvedValue({
        data: mockBinInfo,
      });
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    test('includes binInfo in onChange event when binLookup is enabled', async () => {
      const onChange = jest.fn();

      render(
        <BasisTheoryProvider bt={mockBt}>
          <CardNumberElement
            btRef={mockedRef}
            binLookup={true}
            onChange={onChange}
            placeholder="Card Number"
            style={{}}
          />
        </BasisTheoryProvider>
      );

      const el = screen.getByPlaceholderText('Card Number');
      fireEvent.changeText(el, '424242'); // 6 digits to trigger bin lookup

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith(
          expect.objectContaining({
            binInfo: expect.objectContaining({
              brand: 'visa',
              funding: 'debit',
              issuer: expect.objectContaining({
                name: 'Test Bank',
              }),
            }),
          })
        );
      });
    });

    test('does not include binInfo in onChange event when binLookup is disabled', async () => {
      const onChange = jest.fn();

      render(
        <BasisTheoryProvider bt={mockBt}>
          <CardNumberElement
            btRef={mockedRef}
            binLookup={false}
            onChange={onChange}
            placeholder="Card Number"
            style={{}}
          />
        </BasisTheoryProvider>
      );

      const el = screen.getByPlaceholderText('Card Number');
      fireEvent.changeText(el, '424242');

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith(
          expect.not.objectContaining({
            binInfo: expect.anything(),
          })
        );
      });
    });

    test('makes API call to correct endpoint for bin lookup', async () => {
      const onChange = jest.fn();

      render(
        <BasisTheoryProvider bt={mockBt}>
          <CardNumberElement
            btRef={mockedRef}
            binLookup={true}
            onChange={onChange}
            placeholder="Card Number"
            style={{}}
          />
        </BasisTheoryProvider>
      );

      const el = screen.getByPlaceholderText('Card Number');
      fireEvent.changeText(el, '424242424242424242'); // Full card number

      await waitFor(() => {
        expect(mockedAxios).toHaveBeenCalledWith({
          url: 'https://api.basistheory.com/enrichments/card-details?bin=424242',
          method: 'get',
          headers: {
            'BT-API-KEY': 'test-api-key',
          },
        });
      });
    });

    test('handles bin lookup API errors gracefully', async () => {
      const onChange = jest.fn();
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      mockedAxios.mockRejectedValue(new Error('API Error'));

      render(
        <BasisTheoryProvider bt={mockBt}>
          <CardNumberElement
            btRef={mockedRef}
            binLookup={true}
            onChange={onChange}
            placeholder="Card Number"
            style={{}}
          />
        </BasisTheoryProvider>
      );

      const el = screen.getByPlaceholderText('Card Number');
      fireEvent.changeText(el, '424242424242424242');

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('BIN lookup failed:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });

    test('caches bin lookup results to avoid duplicate API calls', async () => {
      const onChange = jest.fn();

      render(
        <BasisTheoryProvider bt={mockBt}>
          <CardNumberElement
            btRef={mockedRef}
            binLookup={true}
            onChange={onChange}
            placeholder="Card Number"
            style={{}}
          />
        </BasisTheoryProvider>
      );

      const el = screen.getByPlaceholderText('Card Number');
      
      // First call
      fireEvent.changeText(el, '424242424242424242');
      await waitFor(() => {
        expect(mockedAxios).toHaveBeenCalledTimes(1);
      });

      // Clear and enter same BIN again
      fireEvent.changeText(el, '');
      fireEvent.changeText(el, '424242424242424242');
      
      // Should not make another API call due to caching
      await waitFor(() => {
        expect(mockedAxios).toHaveBeenCalledTimes(1);
      });
    });

    test('only triggers bin lookup for 6-digit BINs', async () => {
      const onChange = jest.fn();

      render(
        <BasisTheoryProvider bt={mockBt}>
          <CardNumberElement
            btRef={mockedRef}
            binLookup={true}
            onChange={onChange}
            placeholder="Card Number"
            style={{}}
          />
        </BasisTheoryProvider>
      );

      const el = screen.getByPlaceholderText('Card Number');
      
      // Less than 6 digits - should not trigger lookup
      fireEvent.changeText(el, '42424');
      expect(mockedAxios).not.toHaveBeenCalled();

      // Exactly 6 digits - should trigger lookup
      fireEvent.changeText(el, '424242');
      await waitFor(() => {
        expect(mockedAxios).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Combined Co-badge Support and Bin Lookup', () => {
    const mockBt = {
      config: {
        apiKey: 'test-api-key',
        apiBaseUrl: 'https://api.basistheory.com',
      },
    };

    const mockBinInfoWithCoBadge = {
      brand: 'visa',
      funding: 'debit',
      issuer: {
        country: 'US',
        name: 'Test Bank',
      },
      segment: 'consumer',
      additional: [
        {
          brand: 'cartes-bancaires',
          funding: 'debit',
          issuer: {
            country: 'US',
            name: 'Test Bank',
          },
        },
      ],
    };

    beforeEach(() => {
      jest.clearAllMocks();
      jest.spyOn(useBinLookupModule, 'useBinLookup').mockReturnValue({
        binInfo: mockBinInfoWithCoBadge,
      });
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    test('includes both binInfo and selectedNetwork when both features are enabled', async () => {
      const onChange = jest.fn();

      render(
        <BasisTheoryProvider bt={mockBt}>
          <CardNumberElement
            btRef={mockedRef}
            binLookup={true}
            coBadgedSupport={[CoBadgedSupport.CartesBancaires]}
            onChange={onChange}
            placeholder="Card Number"
            style={{}}
          />
        </BasisTheoryProvider>
      );

      const el = screen.getByPlaceholderText('Card Number');
      fireEvent.changeText(el, '4242424242424242');

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith(
          expect.objectContaining({
            binInfo: expect.objectContaining({
              brand: 'visa',
              additional: expect.arrayContaining([
                expect.objectContaining({
                  brand: 'cartes-bancaires',
                }),
              ]),
            }),
            selectedNetwork: undefined, // Initially undefined
          })
        );
      });
    });
  });
});
