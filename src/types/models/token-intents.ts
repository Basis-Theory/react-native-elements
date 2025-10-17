export interface TokenIntent<T = unknown> {
  id: string;
  type: string;
  tenantId: string;
  data?: T;
  createdBy?: string;
  createdAt?: string;
  expiresAt?: string;
  _debug?: {
    cfRay?: string;
    btTraceId?: string;
  };
}

export interface CreateTokenIntent<T = unknown> {
  type: string;
  data: T;
  expiresAt?: string;
}
