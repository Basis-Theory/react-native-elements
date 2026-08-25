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

    describe('stage environments', () => {
      it.each([
        ['test', 'https://api.test.basistheory.com'],
        ['uat', 'https://api.btsandbox.com'],
        ['dev', 'https://api.flock-dev.com'],
      ])('should resolve the %s environment', (environment, expected) => {
        expect(getDefaultApiBaseUrl(undefined, false, environment)).toBe(
          expected
        );
      });

      it('should use the dev NG host for the dev environment', () => {
        expect(getDefaultApiBaseUrl(undefined, true, 'dev')).toBe(
          'https://api-ng.flock-dev.com'
        );
      });

      it.each([
        ['TEST', 'https://api.test.basistheory.com'],
        ['Uat', 'https://api.btsandbox.com'],
        ['DEV', 'https://api.flock-dev.com'],
      ])(
        'should match the environment name %s case-insensitively',
        (environment, expected) => {
          expect(getDefaultApiBaseUrl(undefined, false, environment)).toBe(
            expected
          );
        }
      );

      it.each(['production', 'PRODUCTION', 'unknown'])(
        'should fall back to the compatibility default for the environment %s',
        (environment) => {
          expect(getDefaultApiBaseUrl(undefined, false, environment)).toBe(
            'https://api.basistheory.com'
          );
        }
      );
    });

    describe('regions', () => {
      it.each([
        ['us', 'https://api.us.basistheory.com'],
        ['eu', 'https://api.eu.basistheory.com'],
      ])('should resolve the %s region in production', (region, expected) => {
        expect(getDefaultApiBaseUrl(undefined, false, undefined, region)).toBe(
          expected
        );
      });

      it.each([
        ['us', 'https://api.us.flock-dev.com'],
        ['eu', 'https://api.eu.flock-dev.com'],
      ])(
        'should resolve the %s region in the dev environment',
        (region, expected) => {
          expect(getDefaultApiBaseUrl(undefined, false, 'dev', region)).toBe(
            expected
          );
        }
      );

      it.each([
        ['US', 'https://api.us.basistheory.com'],
        ['Eu', 'https://api.eu.basistheory.com'],
      ])(
        'should match the region name %s case-insensitively',
        (region, expected) => {
          expect(getDefaultApiBaseUrl(undefined, false, undefined, region)).toBe(
            expected
          );
        }
      );

      it.each(['us', 'eu'])(
        'should prioritize the %s region over useNgApi',
        (region) => {
          expect(getDefaultApiBaseUrl(undefined, true, undefined, region)).toBe(
            `https://api.${region}.basistheory.com`
          );
        }
      );

      it.each(['us', 'eu'])(
        'should ignore the %s region for single-region environments',
        (region) => {
          expect(getDefaultApiBaseUrl(undefined, false, 'test', region)).toBe(
            'https://api.test.basistheory.com'
          );
          expect(getDefaultApiBaseUrl(undefined, false, 'uat', region)).toBe(
            'https://api.btsandbox.com'
          );
        }
      );

      it.each(['apac', 'unknown'])(
        'should fall back to the compatibility default for the region %s',
        (region) => {
          expect(getDefaultApiBaseUrl(undefined, false, undefined, region)).toBe(
            'https://api.basistheory.com'
          );
        }
      );
    });

    it.each([
      ['us', 'https://api.us.basistheory.com'],
      ['eu', 'https://api.eu.basistheory.com'],
      ['EU', 'https://api.eu.basistheory.com'],
    ])(
      'should honour the region %s named via environment as an alias',
      (environment, expected) => {
        expect(getDefaultApiBaseUrl(undefined, false, environment)).toBe(
          expected
        );
      }
    );

    it('should prefer an explicit region over one named via environment', () => {
      expect(getDefaultApiBaseUrl(undefined, false, 'us', 'eu')).toBe(
        'https://api.eu.basistheory.com'
      );
    });

    it.each(['us', 'eu'])(
      'should prioritize an explicit apiBaseUrl over the %s region',
      (region) => {
        expect(
          getDefaultApiBaseUrl('https://api.customer.com', false, 'dev', region)
        ).toBe('https://api.customer.com');
      }
    );
  });

  describe('getBasisTheoryConfig', () => {
    // Guards the wiring the ConfigManager bug broke: secondary clients read the resolved
    // baseUrl from here, so it has to reflect `environment` rather than the raw option.
    it('should expose the resolved regional baseUrl', async () => {
      await loadBasisTheoryInstance(
        'key',
        undefined,
        false,
        false,
        undefined,
        'eu'
      );

      expect(getBasisTheoryConfig().baseUrl).toBe(
        'https://api.eu.basistheory.com'
      );
    });
  });
});
