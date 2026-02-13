import { _elementErrors, _elementValues } from '../../src/ElementValues';
import {
  CreateTokenIntentWithBtRef,
  TokenIntents,
  TokenizeData,
} from '../../src/modules/tokenIntents';
import type { BasisTheoryInstance as BasisTheoryType } from '../../src/types';

jest.mock('../../src/ElementValues', () => ({
  _elementValues: {},
  _elementErrors: {},
}));

describe('tokens', () => {
  beforeEach(() => {
    Object.assign(_elementValues, {
      '123': 'my very sensitive value',
      '456': 'my other very sensitive value',
      firstArrayElement: 'first sensitive element in array',
      secondArrayElement: 'second sensitive element in array',
      expirationDate: '12/23',
    });

    Object.assign(_elementErrors, {});
  });
  afterAll(() => {
    Object.keys(_elementValues).forEach((key) => delete _elementValues[key]);
    Object.keys(_elementErrors).forEach((key) => delete _elementErrors[key]);
  });

  test('calls bt tokens create', async () => {
    const mockCreate = jest.fn();
    const tokenIntents = TokenIntents({
      tokenIntents: { create: mockCreate },
    } as unknown as BasisTheoryType);

    const tokenWithRef = {
      id: 'tokenID',
      type: 'card',
      data: {
        number: { id: '123', format: jest.fn() },
        nestedObject: {
          test: { id: '456', format: jest.fn() },
        },
        myArray: [
          { id: 'firstArrayElement', format: jest.fn() },
          { id: 'secondArrayElement', format: jest.fn() },
        ],
      },
    } as unknown as CreateTokenIntentWithBtRef;

    const expectedResult = {
      id: 'tokenID',
      type: 'card',
      data: {
        number: 'my very sensitive value',
        nestedObject: {
          test: 'my other very sensitive value',
        },
        myArray: [
          'first sensitive element in array',
          'second sensitive element in array',
        ],
      },
    };

    await tokenIntents.create(tokenWithRef);

    expect(mockCreate).toHaveBeenCalledWith(expectedResult, undefined);
  });

});

describe('tokens - Validation', () => {
  test('throws if there are any validation errors', () => {
    Object.assign(_elementErrors, {
      secondArrayElement: 'incomplete',
    });

    const tokenIntents = TokenIntents({} as BasisTheoryType);

    const tokenWithRef = {
      id: 'tokenID',
      type: 'card',
      data: {
        number: { id: '123', format: jest.fn() },
        nestedObject: {
          test: { id: '456', format: jest.fn },
        },
        myArray: [
          { id: 'firstArrayElement', format: jest.fn() },
          { id: 'secondArrayElement', format: jest.fn() },
        ],
      },
    } as unknown as CreateTokenIntentWithBtRef;

    const action = async () => {
      await tokenIntents.create(tokenWithRef);
    };

    expect(() => action()).rejects.toThrow(
      'Unable to create token. Payload contains invalid values. Review elements events for more details.'
    );
  });
});
