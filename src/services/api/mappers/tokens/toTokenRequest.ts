import { CreateToken } from '../../../../types';
import { convertToSnakeCase } from '../case-conversion-utils';
import { isTokenRequest } from './type-guards';

export const toTokenRequest = (payload: Partial<CreateToken>): Record<string, unknown> | undefined => {
  const _payload = convertToSnakeCase(payload);

  return isTokenRequest(_payload)
    ? { ..._payload, data: payload.data, metadata: payload.metadata }
    : undefined;
};
