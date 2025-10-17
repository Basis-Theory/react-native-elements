import { UpdateToken } from '../../../../types';
import { convertToSnakeCase } from '../case-conversion-utils';
import { isUpdateToken } from './type-guards';

export const toUpdateTokenRequest = (payload: Partial<UpdateToken>) => {
  const _payload = convertToSnakeCase(payload);

  return isUpdateToken(_payload)
    ? { ..._payload, data: payload.data, metadata: payload.metadata }
    : undefined;
};
