import {
  BasisTheoryApiError,
  BasisTheoryValidationError,
  ProxyRequestOptions,
} from '../../types';
import { getDeviceInfo } from '../deviceInfo';

const API_KEY_HEADER = 'BT-API-KEY';
const BT_TRACE_ID_HEADER = 'bt-trace-id';
const BT_IDEMPOTENCY_KEY_HEADER = 'bt-idempotency-key';
const BT_PROXY_URL_HEADER = 'BT-PROXY-URL';
const BT_DEVICE_INFO_HEADER = 'BT-DEVICE-INFO';
const CF_RAY = 'cf-ray';

interface ProxyConfig {
  apiKey?: string;
  baseUrl: string;
  debug?: boolean;
}

type ProxyMethods = 'get' | 'post' | 'put' | 'patch' | 'delete';

const buildProxyHeaders = (
  config: ProxyConfig,
  options?: ProxyRequestOptions
): Headers => {
  const headers = new Headers();

  // Set content type for requests with bodies
  headers.set('Content-Type', 'application/json');

  // Set API key
  if (options?.apiKey || config.apiKey) {
    headers.set(API_KEY_HEADER, options?.apiKey || config.apiKey!);
  }

  // Set correlation ID for tracing
  if (options?.correlationId) {
    headers.set(BT_TRACE_ID_HEADER, options.correlationId);
  }

  // Set idempotency key
  if (options?.idempotencyKey) {
    headers.set(BT_IDEMPOTENCY_KEY_HEADER, options.idempotencyKey);
  }

  // Set custom headers from options
  if (options?.headers) {
    Object.entries(options?.headers).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        headers.set(key, String(value));
      }
    });
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

const buildProxyUrl = (
  baseUrl: string,
  path?: string,
  query?: Record<string, unknown>
): string => {
  // Input validation
  if (!baseUrl || typeof baseUrl !== 'string') {
    throw new TypeError('baseUrl must be a non-empty string');
  }

  let url = baseUrl;

  // Explicit path handling with clear semantics
  if (path === undefined) {
    // No path modification - use baseUrl exactly as provided
    url = baseUrl;
  } else if (path === '') {
    // Empty string explicitly requests trailing slash
    url = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  } else {
    // Non-empty path: normalize to prevent double slashes
    const normalizedBase = baseUrl.endsWith('/')
      ? baseUrl.slice(0, -1)
      : baseUrl;
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    url = `${normalizedBase}${normalizedPath}`;
  }

  // Add query parameters if provided
  if (query && Object.keys(query).length > 0) {
    const searchParams = new URLSearchParams();

    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });

    url = `${url}?${searchParams.toString()}`;
  }

  return url;
};

const makeProxyRequest = async (
  config: ProxyConfig,
  method: ProxyMethods,
  options?: ProxyRequestOptions
): Promise<{ data: unknown; headers: Record<string, string> }> => {
  const headers = buildProxyHeaders(config, options);

  const proxyUrl =
    options?.headers?.['BT-PROXY-URL'] || options?.headers?.['bt-proxy-url'];

  const proxyKey =
    options?.headers?.['BT-PROXY-KEY'] || options?.headers?.['bt-proxy-key'];

  if (proxyUrl && proxyKey) {
    throw new BasisTheoryValidationError(
      'Only one of BT-PROXY-URL or BT-PROXY-KEY is required for proxy requests',
      {},
      []
    );
  }

  if (!proxyUrl && !proxyKey) {
    throw new BasisTheoryValidationError(
      'Either BT-PROXY-URL or BT-PROXY-KEY header is required for proxy requests',
      {},
      []
    );
  }

  const destinationUrl = buildProxyUrl(
    String(proxyUrl),
    options?.path,
    options?.query
  );

  headers.set(BT_PROXY_URL_HEADER, destinationUrl);

  const requestUrl = `${config.baseUrl}/proxy`;

  const requestInit: RequestInit = {
    method: method.toUpperCase(),
    headers,
  };

  if (
    options?.body &&
    (method === 'post' || method === 'put' || method === 'patch')
  ) {
    requestInit.body = JSON.stringify(options.body);
  }

  const response = await fetch(requestUrl, requestInit);

  let data: unknown;
  const contentType = response.headers.get('content-type');

  try {
    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }
  } catch {
    data = null;
  }

  if (!response.ok) {
    if (
      response.status >= 400 &&
      response.status < 500 &&
      typeof data === 'object' &&
      data &&
      'errors' in data
    ) {
      const errorData = data as { title?: string; errors: unknown };
      throw new BasisTheoryValidationError(
        errorData.title || 'Validation failed',
        errorData.errors,
        [] // deprecated validation field
      );
    }

    const errorData = data as { title?: string };
    throw new BasisTheoryApiError(
      typeof data === 'object' && data && 'title' in data
        ? errorData.title || 'Proxy request failed'
        : 'Proxy request failed',
      response.status,
      data
    );
  }

  const responseHeaders: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    responseHeaders[key] = value;
  });

  const cfRay = response.headers.get(CF_RAY);
  const btTraceId = response.headers.get(BT_TRACE_ID_HEADER);
  const debugInfo = config.debug ? { cfRay, btTraceId } : undefined;

  if (options?.includeResponseHeaders) {
    return {
      data,
      headers: responseHeaders,
      ...{ _debug: debugInfo },
    };
  }

  return {
    data:
      typeof data === 'string'
        ? data
        : {
            ...(typeof data === 'object' && data ? data : { data }),
            ...{ _debug: debugInfo },
          },
    headers: responseHeaders,
  };
};

// Proxy service methods
const proxyGet =
  (config: ProxyConfig) =>
  (
    options?: ProxyRequestOptions
  ): Promise<{ data: unknown; headers: Record<string, string> }> =>
    makeProxyRequest(config, 'get', options);

const proxyPost =
  (config: ProxyConfig) =>
  (
    options?: ProxyRequestOptions
  ): Promise<{ data: unknown; headers: Record<string, string> }> =>
    makeProxyRequest(config, 'post', options);

const proxyPut =
  (config: ProxyConfig) =>
  (
    options?: ProxyRequestOptions
  ): Promise<{ data: unknown; headers: Record<string, string> }> =>
    makeProxyRequest(config, 'put', options);

const proxyPatch =
  (config: ProxyConfig) =>
  (
    options?: ProxyRequestOptions
  ): Promise<{ data: unknown; headers: Record<string, string> }> =>
    makeProxyRequest(config, 'patch', options);

const proxyDelete =
  (config: ProxyConfig) =>
  (
    options?: ProxyRequestOptions
  ): Promise<{ data: unknown; headers: Record<string, string> }> =>
    makeProxyRequest(config, 'delete', options);

// Create proxy service functions bound to config
const createProxyClient = (config: ProxyConfig) => ({
  get: proxyGet(config),
  post: proxyPost(config),
  put: proxyPut(config),
  patch: proxyPatch(config),
  delete: proxyDelete(config),
});

export { createProxyClient, type ProxyConfig };
