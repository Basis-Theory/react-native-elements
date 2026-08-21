import {
  getBasisTheoryConfig,
  getDefaultApiBaseUrl,
  loadBasisTheoryInstance,
} from '../../src/services/basis-theory-js';

jest.mock('../../src/services/api/bt-client', () => ({
  createBasisTheoryApi: jest.fn(() => ({})),
}));

jest.mock('../../src/services/api/proxy-client', () => ({
  createProxyClient: jest.fn(() => ({})),
}));

describe('basis-theory-js service', () => {
  describe('getDefaultApiBaseUrl', () => {
    it('should use the compatibility default when nothing is configured', () => {
      expect(getDefaultApiBaseUrl()).toBe('https://api.basistheory.com');
    });

    it('should use the NG host when useNgApi is set', () => {
      expect(getDefaultApiBaseUrl(undefined, true)).toBe(
        'https://api-ng.basistheory.com'
      );
    });

    it('should resolve the test environment to UAT', () => {
      expect(getDefaultApiBaseUrl(undefined, false, 'test')).toBe(
        'https://api.test.basistheory.com'
      );
    });

    it.each([
      ['us', 'https://api.us.basistheory.com'],
      ['eu', 'https://api.eu.basistheory.com'],
    ])(
      'should resolve the %s environment to its regional host',
      (environment, expected) => {
        expect(getDefaultApiBaseUrl(undefined, false, environment)).toBe(
          expected
        );
      }
    );

    it.each([
      ['US', 'https://api.us.basistheory.com'],
      ['Eu', 'https://api.eu.basistheory.com'],
      ['TEST', 'https://api.test.basistheory.com'],
    ])(
      'should match the environment name %s case-insensitively',
      (environment, expected) => {
        expect(getDefaultApiBaseUrl(undefined, false, environment)).toBe(
          expected
        );
      }
    );

    it.each(['us', 'eu'])(
      'should prioritize the %s region over useNgApi',
      (environment) => {
        expect(getDefaultApiBaseUrl(undefined, true, environment)).toBe(
          `https://api.${environment}.basistheory.com`
        );
      }
    );

    it.each(['us', 'eu', 'test'])(
      'should prioritize an explicit apiBaseUrl over the %s environment',
      (environment) => {
        expect(
          getDefaultApiBaseUrl('https://api.customer.com', false, environment)
        ).toBe('https://api.customer.com');
      }
    );

    it.each(['production', 'PRODUCTION', 'unknown'])(
      'should fall back to the compatibility default for the unrecognized environment %s',
      (environment) => {
        expect(getDefaultApiBaseUrl(undefined, false, environment)).toBe(
          'https://api.basistheory.com'
        );
      }
    );
  });

  describe('getBasisTheoryConfig', () => {
    // Guards the wiring the ConfigManager bug broke: secondary clients read the resolved
    // baseUrl from here, so it has to reflect `environment` rather than the raw option.
    it('should expose the resolved regional baseUrl', async () => {
      await loadBasisTheoryInstance('key', undefined, false, false, 'eu');

      expect(getBasisTheoryConfig().baseUrl).toBe(
        'https://api.eu.basistheory.com'
      );
    });
  });
});
