import { DeviceInfo } from './device';

export interface ProxyRequestOptions {
  headers?: Record<string, string | number | boolean>;
  apiKey?: string;
  path?: string;
  query?: Record<string, unknown>;
  body?: unknown;
  correlationId?: string;
  idempotencyKey?: string;
  includeResponseHeaders?: boolean;
  deviceInfo?: DeviceInfo;
}
