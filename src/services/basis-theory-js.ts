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
    US: 'https://api.us.basistheory.com',
    EU: 'https://api.eu.basistheory.com',
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

  // Match environment names case-insensitively. A caller who writes 'EU' means the EU
  // region, and silently handing them the compatibility host is the exact mis-routing
  // an explicit region is meant to prevent.
  const selectedEnvironment = environment?.toLowerCase();

  // UAT environment
  if (selectedEnvironment === 'test') {
    return API_URLS.UAT;
  }

  // An explicitly selected region outranks useNgApi: that flag picks a gateway, while a
  // region names the only origin allowed to serve the tenant's data.
  if (selectedEnvironment === 'us') {
    return API_URLS.PROD.US;
  }

  if (selectedEnvironment === 'eu') {
    return API_URLS.PROD.EU;
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
