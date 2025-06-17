import { _elementErrors } from '../../src/ElementValues';
import {
  CreateTokenWithBtRef,
  Tokens,
} from '../../src/modules/tokens';
import type { BasisTheory as BasisTheoryType } from '@basis-theory/basis-theory-js/types/sdk';
import { EncryptValidationError } from '../../src/services/tokenEncryption';

jest.mock('../../src/ElementValues', () => ({
  _elementValues: {},
  _elementErrors: {},
}));

describe('tokens - Encrypt', () => {
  const mockPublicKey = '-----BEGIN PUBLIC KEY-----\nm4trz9vdM2a0YAIBBT15OU71RpfLrFBtbGOD3uS0g10=\n-----END PUBLIC KEY-----';
  const mockKeyId = 'test-key-id-123';
  const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

  beforeEach(() => {
    Object.assign(_elementErrors, {});
    consoleErrorSpy.mockClear();
  });

  afterAll(() => {
    Object.keys(_elementErrors).forEach((key) => delete _elementErrors[key]);
  });

  test('calls encrypt with single token request', async () => {
    const tokenWithRef = {
      type: 'card',
      data: {
        number: { id: '123', format: jest.fn() },
        expiration_month: { id: 'expirationDate', datepart: 'month' },
        expiration_year: { id: 'expirationDate', datepart: 'year' },
      },
    } as unknown as CreateTokenWithBtRef;

    const encryptRequest = {
      tokenRequests: tokenWithRef,
      publicKeyPEM: mockPublicKey,
      keyId: mockKeyId,
    };

    const result = await Tokens({} as BasisTheoryType).encrypt(encryptRequest);
    expect(result).toBeDefined();
    expect(result).toHaveLength(1);
    expect(result![0].encrypted).toBeDefined();
    expect(result![0].encrypted.split('.').length).toBe(5);
    expect(result![0].type).toBe('card');
  });

  test('calls bt encrypt with multiple token requests', async () => {
    const cardTokenWithRef = {
      type: 'card',
      data: {
        number: { id: '123', format: jest.fn() },
      },
    } as unknown as CreateTokenWithBtRef;

    const bankTokenWithRef = {
      type: 'bank',
      data: {
        account_number: { id: '456', format: jest.fn() },
      },
    } as unknown as CreateTokenWithBtRef;

    const encryptRequest = {
      tokenRequests: {
        card: cardTokenWithRef,
        bank: bankTokenWithRef,
      },
      publicKeyPEM: mockPublicKey,
      keyId: mockKeyId,
    };

    const result = await Tokens({} as BasisTheoryType).encrypt(encryptRequest);
    expect(result).toBeDefined();
    expect(result).toHaveLength(2);
    expect(result![0].encrypted).toBeDefined();
    expect(result![0].encrypted.split('.').length).toBe(5);
    expect(result![0].type).toBe('card');
    expect(result![1].encrypted).toBeDefined();
    expect(result![1].encrypted.split('.').length).toBe(5);
    expect(result![1].type).toBe('bank');
  });

  test('handles nested objects in encrypt requests', async () => {
    const tokenWithRef = {
      type: 'card',
      data: {
        number: { id: '123', format: jest.fn() },
        billing: {
          address: { id: '456', format: jest.fn() },
        },
        tags: [
          { id: 'firstArrayElement', format: jest.fn() },
          { id: 'secondArrayElement', format: jest.fn() },
        ],
      },
    } as unknown as CreateTokenWithBtRef;

    const encryptRequest = {
      tokenRequests: tokenWithRef,
      publicKeyPEM: mockPublicKey,
      keyId: mockKeyId,
    };

    const result = await Tokens({} as BasisTheoryType).encrypt(encryptRequest);
    expect(result).toBeDefined();
    expect(result).toHaveLength(1);
    expect(result![0].encrypted).toBeDefined();
    expect(result![0].encrypted.split('.').length).toBe(5);
    expect(result![0].type).toBe('card');
  });

  test('throws error when publicKeyPEM is null', async () => {

    const tokenWithRef = {
      type: 'card',
      data: {
        number: { id: '123', format: jest.fn() },
      },
    } as unknown as CreateTokenWithBtRef;

    const encryptRequest = {
      tokenRequests: tokenWithRef,
      publicKeyPEM: '',
      keyId: mockKeyId,
    };

    await Tokens({} as BasisTheoryType).encrypt(encryptRequest);
    const error = consoleErrorSpy.mock.calls[0][0];
    expect(error).toBeInstanceOf(EncryptValidationError);
    expect(error.message).toContain('Public key PEM is required');
  });

  test('throws error when keyId is null', async () => {

    const tokenWithRef = {
      type: 'card',
      data: {
        number: { id: '123', format: jest.fn() },
      },
    } as unknown as CreateTokenWithBtRef;

    const encryptRequest = {
      tokenRequests: tokenWithRef,
      publicKeyPEM: mockPublicKey,
      keyId: '',
    };


    await Tokens({} as BasisTheoryType).encrypt(encryptRequest);
    const error = consoleErrorSpy.mock.calls[0][0];
    expect(error).toBeInstanceOf(EncryptValidationError);
    expect(error.message).toContain('Key ID is required');

  });

  test('throws error when tokenRequests is null', async () => {
    const encryptRequest = {
      tokenRequests: {},
      publicKeyPEM: mockPublicKey,
      keyId: mockKeyId,
    };

    await Tokens({} as BasisTheoryType).encrypt(encryptRequest);
    const error = consoleErrorSpy.mock.calls[0][0];
    expect(error).toBeInstanceOf(EncryptValidationError);
    expect(error.message).toContain('No valid tokens found to encrypt');

  });

  test('throws error when validation fails for encrypt', () => {
    Object.assign(_elementErrors, {
      '123': 'invalid card number',
    });

    const tokenWithRef = {
      type: 'card',
      data: {
        number: { id: '123', format: jest.fn() },
      },
    } as unknown as CreateTokenWithBtRef;

    const encryptRequest = {
      tokenRequests: tokenWithRef,
      publicKeyPEM: mockPublicKey,
      keyId: mockKeyId,
    };

    const action = async () => {
      await Tokens({} as BasisTheoryType).encrypt(encryptRequest);
    };

    expect(() => action()).rejects.toThrow(
      'Unable to encrypt token. Payload contains invalid values. Review elements events for more details.'
    );
  });

});
