import {
  BasisTheoryApiError,
  BasisTheoryValidationError,
  CreateSessionResponse,
  CreateToken,
  CreateTokenIntent,
  Token,
  TokenIntent,
  TokenizeData,
  TokenizeDataModel,
  DeviceInfo,
  UpdateToken,
} from '../../types';
import { getDeviceInfo } from '../deviceInfo';
import { DeepTransformKeysCase } from './mappers/case-conversion-utils';
import { toSessionResponse } from './mappers/sessions/toSessionResponse';
import { toTokenIntentRequest } from './mappers/token-intents/toTokenIntentRequest';
import { toTokenIntentResponse } from './mappers/token-intents/toTokenIntentResponse';
import { toTokenRequest } from './mappers/tokens/toTokenRequest';
import { toTokenResponse } from './mappers/tokens/toTokenResponse';
import { toUpdateTokenRequest } from './mappers/tokens/toUpdateTokenRequest';

const API_KEY_HEADER = 'BT-API-KEY';
const BT_TRACE_ID_HEADER = 'bt-trace-id';
const BT_IDEMPOTENCY_KEY_HEADER = 'bt-idempotency-key';
const CF_RAY = 'cf-ray';
const BT_DEVICE_INFO_HEADER = 'BT-DEVICE-INFO';

type SnakeCaseToken = DeepTransformKeysCase<Token, 'snake'>;

interface RequestOptions {
  apiKey?: string;
  correlationId?: string;
  idempotencyKey?: string;
  skipCaseConversion?: boolean;
  deviceInfo?: DeviceInfo;
}

interface BasisTheoryConfig {
  apiKey?: string;
  baseUrl: string;
  debug?: boolean;
}

const buildHeaders = (
  config: BasisTheoryConfig,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  options?: RequestOptions
): Headers => {
  const headers = new Headers();

  // Set appropriate Content-Type based on method
  if (method === 'PATCH') {
    headers.set('Content-Type', 'application/merge-patch+json');
  } else if (method === 'POST') {
    headers.set('Content-Type', 'application/json');
  }
  // GET and DELETE typically don't need Content-Type

  const apiKey = options?.apiKey ?? config.apiKey;
  if (apiKey) headers.set(API_KEY_HEADER, apiKey);

  if (options?.correlationId) {
    headers.set(BT_TRACE_ID_HEADER, options.correlationId);
  }

  if (options?.idempotencyKey) {
    headers.set(BT_IDEMPOTENCY_KEY_HEADER, options.idempotencyKey);
  }

  // Automatically collect and include device info
  // Use provided deviceInfo or collect it automatically
  const deviceInfo = options?.deviceInfo ?? getDeviceInfo();
  const data = JSON.stringify(deviceInfo);
  // Use btoa for base64 encoding - available in React Native via polyfill
  const base64 = typeof btoa !== 'undefined' 
    ? btoa(data)
    : Buffer.from(data).toString('base64');
  headers.set(BT_DEVICE_INFO_HEADER, base64);

  return headers;
};

const makeRequest = async <TResponse = unknown>(
  config: BasisTheoryConfig,
  endpoint: string,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  body?: unknown,
  options?: RequestOptions
): Promise<TResponse> => {
  const headers = buildHeaders(config, method, options);
  const url = `${config.baseUrl}${endpoint}`;

  const requestInit: RequestInit = {
    method,
    headers,
  };

  console.log('requestInit', requestInit);

  if (body && method !== 'GET') {
    requestInit.body = JSON.stringify(body);
  }
  const response = await fetch(url, requestInit);
  const data = await response.json();

  if (!response.ok) {
    if (response.status >= 400 && response.status < 500) {
      // Client error - likely validation issue
      if (data.errors && typeof data.errors === 'object') {
        throw new BasisTheoryValidationError(
          data.title || 'Validation failed',
          data.errors,
          [] // deprecated validation field
        );
      }
      throw new BasisTheoryApiError(
        data.title || 'API request failed',
        response.status,
        data
      );
    }

    throw new BasisTheoryApiError(
      data.title || 'API request failed',
      response.status,
      data
    );
  }

  const cfRay = response.headers.get(CF_RAY);
  const btTraceId = response.headers.get(BT_TRACE_ID_HEADER);

  if (typeof data === 'string') {
    return data as TResponse;
  }

  return {
    ...data,
    ...{ _debug: config.debug ? { cfRay, btTraceId } : undefined },
  } as TResponse;
};

// Token service methods
const createToken =
  (config: BasisTheoryConfig) =>
  async (payload: CreateToken, options?: RequestOptions): Promise<Token> => {
    const _payload = toTokenRequest(payload);

    const response = await makeRequest<SnakeCaseToken>(
      config,
      '/tokens',
      'POST',
      _payload,
      options
    );

    const tokenResponse = toTokenResponse(response);

    if (tokenResponse == undefined) {
      throw new BasisTheoryApiError('Invalid API response. Try again.', -1);
    }

    return tokenResponse;
  };

const updateToken =
  (config: BasisTheoryConfig) =>
  async (
    id: string,
    payload: UpdateToken,
    options?: RequestOptions
  ): Promise<Token> => {
    const _payload = toUpdateTokenRequest(payload);

    const response = await makeRequest<SnakeCaseToken>(
      config,
      `/tokens/${id}`,
      'PATCH',
      _payload,
      options
    );

    const tokenResponse = toTokenResponse(response);

    if (tokenResponse == undefined) {
      throw new BasisTheoryApiError('Invalid API response. Try again.', -1);
    }

    return tokenResponse;
  };

const retrieveToken =
  (config: BasisTheoryConfig) =>
  async (id: string, options?: RequestOptions): Promise<Token> => {
    const response = await makeRequest<SnakeCaseToken>(
      config,
      `/tokens/${id}`,
      'GET',
      undefined,
      options
    );

    const tokenResponse = toTokenResponse(response);

    if (tokenResponse == undefined) {
      throw new BasisTheoryApiError('Invalid API response. Try again.', -1);
    }

    return tokenResponse;
  };

const deleteToken =
  (config: BasisTheoryConfig) =>
  async (id: string, options?: RequestOptions): Promise<void> => {
    await makeRequest(
      config,
      `/tokens/${id}`,
      'DELETE',
      undefined,
      options
    );
  };

// Tokenization service
const tokenize =
  (config: BasisTheoryConfig) =>
  (
    payload: TokenizeData,
    options?: RequestOptions
  ): Promise<TokenizeDataModel> =>
    makeRequest<TokenizeDataModel>(
      config,
      '/tokenize',
      'POST',
      payload,
      options
    );

// Session service
const createSession =
  (config: BasisTheoryConfig) =>
  async (
    payload?: unknown,
    options?: RequestOptions
  ): Promise<CreateSessionResponse> => {
    const result = await makeRequest<
      DeepTransformKeysCase<CreateSessionResponse, 'snake'>
    >(config, '/sessions', 'POST', payload, options);

    const sessionResponse = toSessionResponse(result);

    if (sessionResponse == undefined) {
      throw new BasisTheoryApiError('Invalid API response. Try again.', -1);
    }

    return sessionResponse;
  };

// Token intents service
const createTokenIntent =
  (config: BasisTheoryConfig) =>
  async (
    payload: CreateTokenIntent,
    options?: RequestOptions
  ): Promise<TokenIntent> => {
    const _payload = toTokenIntentRequest(payload);

    const result = await makeRequest<
      DeepTransformKeysCase<TokenIntent, 'snake'>
    >(config, '/token-intents', 'POST', _payload, options);

    const tokenIntent = toTokenIntentResponse(result);

    if (tokenIntent == undefined) {
      throw new BasisTheoryApiError('Invalid API response. Try again.', -1);
    }

    return tokenIntent;
  };

// Create API service functions bound to config
const createBasisTheoryApi = (config: BasisTheoryConfig) => ({
  tokens: {
    create: createToken(config),
    update: updateToken(config),
    retrieve: retrieveToken(config),
    delete: deleteToken(config),
  },
  tokenize: tokenize(config),
  sessions: {
    create: createSession(config),
  },
  tokenIntents: {
    create: createTokenIntent(config),
  },
});

export {
  createBasisTheoryApi,
  makeRequest,
  type BasisTheoryConfig,
  type RequestOptions,
};
