import { isNil } from '../../utils/nativeUtils';
import { Token, UpdateToken } from '../../../../types';
import { DeepTransformKeysCase } from '../case-conversion-utils';

export const isTokenRequest = (val: unknown): val is Token =>
  !isNil((val as Token)?.data) && !isNil((val as Token)?.type);

// TODO: extend this with all the updateable props
export const isUpdateToken = (val: unknown): val is UpdateToken =>
  !isNil((val as UpdateToken)?.data) ||
  !isNil((val as UpdateToken)?.metadata) ||
  !isNil((val as UpdateToken)?.expiresAt);

interface PaginatedList<T> {
  pagination: {
    totalItems?: number;
    pageNumber?: number;
    pageSize: number;
    totalPages?: number;
    after?: string;
  };
  data: T[];
}

export const isTokenResponse = (val: unknown): val is Token =>
  // data || type to account for `redact` transform in access rules
  (!isNil((val as Token)?.data) || !isNil((val as Token)?.type)) &&
  !isNil((val as Token)?.tenantId);

export const isPaginatedList = <T>(arg: unknown): arg is PaginatedList<T> =>
  (arg as PaginatedList<T>) &&
  (arg as PaginatedList<T>)?.pagination !== undefined &&
  (arg as PaginatedList<T>)?.data !== undefined;

export type TokenResponse = DeepTransformKeysCase<Token, 'snake'>;
