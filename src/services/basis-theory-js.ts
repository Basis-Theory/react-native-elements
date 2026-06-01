import { createBasisTheoryApi, type BasisTheoryConfig } from './api/bt-client';
import { createProxyClient } from './api/proxy-client';

let basisTheoryApi: ReturnType<typeof createBasisTheoryApi>;
let proxyClient: ReturnType<typeof createProxyClient>;
let basisTheoryConfig: BasisTheoryConfig;

// API URL Constants
const API_URLS = {
  LOCALHOST: 'http://localhost:3333',
  UAT: 'https://api.test.basistheory.com',

  DEV: {
    STANDARD: 'https://api.flock-dev.com',
    NG: 'https://api-ng.flock-dev.com',
  },

  PROD: {
    STANDARD: 'https://api.basistheory.com',
    NG: 'https://api-ng.basistheory.com',
  },
} as const;

/**
 * Determines if current environment is development
 */
const isDevEnvironment = (apiBaseUrl?: string): boolean =>
  Boolean(apiBaseUrl?.includes('flock-dev'));

const getDefaultApiBaseUrl = (
  apiBaseUrl?: string,
  useNgApi?: boolean,
  environment?: string
): string => {
  // If custom URL provided, use it
  if (apiBaseUrl) {
    return apiBaseUrl;
  }

  // UAT environment
  if (environment === 'test') {
    return API_URLS.UAT;
  }

  // Development environment
  if (isDevEnvironment(apiBaseUrl)) {
    return useNgApi ? API_URLS.DEV.NG : API_URLS.DEV.STANDARD;
  }

  // Production environment (default)
  return useNgApi ? API_URLS.PROD.NG : API_URLS.PROD.STANDARD;
};

const loadBasisTheoryInstance = async (
  apiKey?: string,
  apiBaseUrl?: string,
  useNgApi?: boolean,
  debug?: boolean,
  environment?: string
): Promise<void> => {
  if (basisTheoryApi && proxyClient) {
    return;
  }

  const baseUrl = getDefaultApiBaseUrl(apiBaseUrl, useNgApi, environment);

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
