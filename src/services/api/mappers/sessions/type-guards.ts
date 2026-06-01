import { isNil } from '../../utils/nativeUtils';
import { CreateSessionResponse } from '../../../../types';

export const isSessionResponse = (val: unknown): val is CreateSessionResponse =>
  !isNil((val as CreateSessionResponse)?.expiresAt) &&
  !isNil((val as CreateSessionResponse)?.nonce) &&
  !isNil((val as CreateSessionResponse)?.sessionKey);
