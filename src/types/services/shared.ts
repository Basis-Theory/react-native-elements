import { DeviceInfo } from '../models/device';

export interface RequestOptions {
  apiKey?: string;
  correlationId?: string;
  idempotencyKey?: string;
  deviceInfo?: DeviceInfo;
}
