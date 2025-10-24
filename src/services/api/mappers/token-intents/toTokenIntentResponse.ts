import { TokenIntent } from '../../../../types';
import {
  convertToCamelCase,
  DeepTransformKeysCase,
} from '../case-conversion-utils';
import { isTokenIntentResponse } from './type-guards';

export const toTokenIntentResponse = (
  response: DeepTransformKeysCase<TokenIntent, 'snake'>
) => {
  const _res = convertToCamelCase(response);

  if (isTokenIntentResponse(_res)) {
    return {
      ..._res,
      data: response.data,
    };
  }

  return undefined;
};
