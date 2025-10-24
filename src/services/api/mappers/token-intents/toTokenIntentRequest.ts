import { CreateTokenIntent } from '../../../../types';
import { convertToSnakeCase } from '../case-conversion-utils';
import { isTokenIntentRequest } from './type-guards';

export const toTokenIntentRequest = (payload: Partial<CreateTokenIntent>) => {
  const _payload = convertToSnakeCase(payload);

  return isTokenIntentRequest(_payload)
    ? {
        ..._payload,
        data: payload.data,
        // metadata: payload.metadata Token Intents do not support metadata
      }
    : undefined;
};
