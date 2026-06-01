import type {
  CreateToken,
  UpdateToken,
  Token,
  TokenizeData,
  TokenizeDataModel,
  CreateSessionResponse,
  CreateTokenIntent,
  TokenIntent,
  ProxyRequestOptions,
} from '../models';
import type { RequestOptions } from './shared';

export interface BasisTheoryTokensService {
  create(payload: CreateToken, options?: RequestOptions): Promise<Token>;
  update(
    id: string,
    payload: UpdateToken,
    options?: RequestOptions
  ): Promise<Token>;
  retrieve(id: string, options?: RequestOptions): Promise<Token>;
  delete(id: string, options?: RequestOptions): Promise<void>;
}

export interface BasisTheorySessionsService {
  create(payload?: unknown, options?: RequestOptions): Promise<CreateSessionResponse>;
}

export interface BasisTheoryTokenIntentsService {
  create(
    payload: CreateTokenIntent,
    options?: RequestOptions
  ): Promise<TokenIntent>;
}

export interface BasisTheoryProxyService {
  get(
    options?: ProxyRequestOptions
  ): Promise<{ data: unknown; headers: Record<string, string> }>;
  post(
    options?: ProxyRequestOptions
  ): Promise<{ data: unknown; headers: Record<string, string> }>;
  put(
    options?: ProxyRequestOptions
  ): Promise<{ data: unknown; headers: Record<string, string> }>;
  patch(
    options?: ProxyRequestOptions
  ): Promise<{ data: unknown; headers: Record<string, string> }>;
  delete(
    options?: ProxyRequestOptions
  ): Promise<{ data: unknown; headers: Record<string, string> }>;
}

export interface BasisTheoryInstance {
  tokens: BasisTheoryTokensService;
  tokenize(
    payload: TokenizeData,
    options?: RequestOptions
  ): Promise<TokenizeDataModel>;
  sessions: BasisTheorySessionsService;
  tokenIntents: BasisTheoryTokenIntentsService;
  proxy: BasisTheoryProxyService;
}
