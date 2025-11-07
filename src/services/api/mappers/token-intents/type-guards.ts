import { isNil } from '../../utils/nativeUtils';
import { TokenIntent } from '../../../../types';

export const isTokenIntentRequest = (val: unknown): val is TokenIntent =>
  !isNil((val as TokenIntent)?.type);

export const isTokenIntentResponse = (val: unknown): val is TokenIntent =>
  !isNil((val as TokenIntent)?.id) &&
  !isNil((val as TokenIntent)?.type) &&
  !isNil((val as TokenIntent)?.tenantId);
