import { CreateSessionResponse } from '../../../../types';
import {
  convertToCamelCase,
  DeepTransformKeysCase,
} from '../case-conversion-utils';
import { isSessionResponse } from './type-guards';

export const toSessionResponse = (
  response: DeepTransformKeysCase<CreateSessionResponse, 'snake'>
) => {
  const _res = convertToCamelCase(response);

  if (isSessionResponse(_res)) {
    return _res;
  }

  return undefined;
};
