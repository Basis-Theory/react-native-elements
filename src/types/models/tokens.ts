import { Metadata, Privacy } from './shared';

export interface Token<T = unknown> {
  id: string;
  type: string;
  tenantId: string;
  data?: T;
  createdBy?: string;
  createdAt?: string;
  modifiedBy?: string;
  modifiedAt?: string;
  fingerprint?: string;
  fingerprintExpression?: string;
  mask?: unknown;
  privacy?: Privacy;
  searchIndexes?: string[];
  metadata?: Metadata;
  expiresAt?: string;
  containers?: string[];
  aliasId?: string;
  _debug?: {
    cfRay?: string;
    btTraceId?: string;
  };
  [key: string]: unknown;
}

export interface CreateToken<T = unknown> {
  id?: string;
  type: string;
  data: T;
  fingerprint?: string;
  fingerprintExpression?: string;
  mask?: unknown;
  privacy?: Privacy;
  searchIndexes?: string[];
  metadata?: Metadata;
  expiresAt?: string;
  deduplicateToken?: boolean;
  containers?: string[];
}

export interface UpdateToken<T = unknown> {
  data?: T;
  privacy?: Privacy;
  searchIndexes?: string[];
  metadata?: Metadata;
  expiresAt?: string | null;
  deduplicateToken?: boolean;
  containers?: string[];
  mask?: unknown;
  fingerprintExpression?: string;
}
