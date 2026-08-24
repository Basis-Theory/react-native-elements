import { createBasisTheoryApi, type BasisTheoryConfig } from './api/bt-client';
import { createProxyClient } from './api/proxy-client';

let basisTheoryApi: ReturnType<typeof createBasisTheoryApi>;
let proxyClient: ReturnType<typeof createProxyClient>;
let basisTheoryConfig: BasisTheoryConfig;

// API URL Constants
const API_URLS = {
  LOCALHOST: 'http://localhost:3333',

  // The UAT environment's own API host. The `test` environment deliberately does not
  // point here: it targets the customer-facing api.test.basistheory.com, which the
  // production edge routes to this origin.
  SANDBOX: 'https://api.btsandbox.com',

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
    TEST: 'https://api.test.basistheory.com',
  },
} as const;

/**
 * Picks the host within a stage. An explicitly selected region outranks useNgApi: that
 * flag picks a gateway, while a region names the only origin allowed to serve the
 * tenant's data.
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

  // Match both names case-insensitively. A caller who writes 'EU' means the EU region,
  // and silently handing them the compatibility host is the exact mis-routing an
  // explicit region is meant to prevent.
  const stage = environment?.toLowerCase();
  const selectedRegion = region?.toLowerCase();

  // `test` and `uat` are single-region environments -- no api.us/api.eu variant of
  // either resolves -- so a selected region is ignored here rather than pointed at a
  // host that does not exist.
  if (stage === 'test') {
    return API_URLS.PROD.TEST;
  }

  if (stage === 'uat') {
    return API_URLS.SANDBOX;
  }

  // React Native has no page origin to infer the stage from, so `environment` is the
  // only signal that selects the dev hosts.
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
