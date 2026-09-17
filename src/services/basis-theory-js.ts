import { createBasisTheoryApi, type BasisTheoryConfig } from './api/bt-client';
import { createProxyClient } from './api/proxy-client';

let basisTheoryApi: ReturnType<typeof createBasisTheoryApi>;
let proxyClient: ReturnType<typeof createProxyClient>;
let basisTheoryConfig: BasisTheoryConfig;

// API URL Constants
const API_URLS = {
  LOCALHOST: 'http://localhost:3333',

  // Both `test` and `uat` resolve here. api.btsandbox.com and api.test.flock-dev.com
  // stage changes before they reach this host and are intentionally not exposed.
  TEST: 'https://api.test.basistheory.com',

  DEV: {
    STANDARD: 'https://api.flock-dev.com',
    NG: 'https://api-ng.flock-dev.com',
    US: 'https://api.us.flock-dev.com',
    EU: 'https://api.eu.flock-dev.com',
  },

  PROD: {
    STANDARD: 'https://api.basistheory.com',
    NG: 'https://api-ng.basistheory.com',
    US: 'https://api.us.basistheory.com',
    EU: 'https://api.eu.basistheory.com',
  },
} as const;

/**
 * Picks the host within a stage. A region outranks useNgApi: that flag chooses a
 * gateway, a region chooses the only origin allowed to serve the tenant's data.
 */
const buildApiUrl = (
  isNg: boolean,
  stageUrls: typeof API_URLS.DEV | typeof API_URLS.PROD,
  region?: string
): string => {
  if (region === 'us') return stageUrls.US;
  if (region === 'eu') return stageUrls.EU;
  return isNg ? stageUrls.NG : stageUrls.STANDARD;
};

const getDefaultApiBaseUrl = (
  apiBaseUrl?: string,
  useNgApi?: boolean,
  environment?: string,
  region?: string
): string => {
  // If custom URL provided, use it
  if (apiBaseUrl) {
    return apiBaseUrl;
  }

  // Names are matched case-insensitively, and a region named in `environment` is taken
  // as an alias for `region`: quietly sending an 'EU' caller to the compatibility host
  // is the mis-route an explicit region exists to prevent.
  const stage = environment?.trim().toLowerCase();
  // Falsy rather than nullish: callers commonly build this as `selectedRegion || ''`,
  // and an empty string must fall through to the environment-derived alias instead of
  // overriding it and silently landing an EU tenant on the compatibility host.
  const selectedRegion =
    region?.trim().toLowerCase() ||
    (stage === 'us' || stage === 'eu' ? stage : undefined);

  // `test` and `uat` are one single-region environment: no api.us/api.eu variant of it
  // resolves, so a selected region is ignored rather than pointed at a dead host.
  if (stage === 'test' || stage === 'uat') {
    return API_URLS.TEST;
  }

  // React Native has no page origin to infer a stage from, so `environment` is the only
  // signal that can select the dev hosts.
  return buildApiUrl(
    Boolean(useNgApi),
    stage === 'dev' ? API_URLS.DEV : API_URLS.PROD,
    selectedRegion
  );
};

const loadBasisTheoryInstance = async (
  apiKey?: string,
  apiBaseUrl?: string,
  useNgApi?: boolean,
  debug?: boolean,
  environment?: string,
  region?: string
): Promise<void> => {
  if (basisTheoryApi && proxyClient) {
    return;
  }

  const baseUrl = getDefaultApiBaseUrl(
    apiBaseUrl,
    useNgApi,
    environment,
    region
  );

  basisTheoryConfig = {
    apiKey,
    baseUrl,
    debug,
  };

  basisTheoryApi = createBasisTheoryApi(basisTheoryConfig);
  proxyClient = createProxyClient(basisTheoryConfig);
};

// Create a proxy interface that matches the old BasisTheory SDK
const getBasisTheoryInstance = () => {
  if (!basisTheoryApi || !proxyClient) {
    throw new Error(
      'BasisTheory instance not initialized. Call loadBasisTheoryInstance first.'
    );
  }

  return {
    ...basisTheoryApi,
    // Use the new proxy client
    proxy: proxyClient,
  };
};

const getBasisTheoryConfig = (): BasisTheoryConfig => {
  if (!basisTheoryConfig) {
    throw new Error(
      'BasisTheory config not initialized. Call loadBasisTheoryInstance first.'
    );
  }
  return basisTheoryConfig;
};

export {
  getBasisTheoryConfig,
  getBasisTheoryInstance,
  getDefaultApiBaseUrl,
  loadBasisTheoryInstance,
};
