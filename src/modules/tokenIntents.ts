import type {
  CreateTokenIntent,
  TokenIntent,
  RequestOptions,
  BasisTheoryInstance,
} from '../types';
import type {
  BTRef,
  InputBTRefWithDatepart,
  PrimitiveType,
} from '../BaseElementTypes';
import { _elementErrors } from '../ElementValues';
import { replaceElementRefs } from '../utils/dataManipulationUtils';
import { isNilOrEmpty } from '../utils/shared';

export type CreateTokenIntentWithBtRef = Omit<CreateTokenIntent, 'data'> & {
  data: Record<string, BTRef | InputBTRefWithDatepart | null | undefined>;
};

export type TokenIntentData = TokenIntent<
  BTRef | InputBTRefWithDatepart | PrimitiveType
>;

export const TokenIntents = (bt: BasisTheoryInstance) => {
  const create = async (
    tokenIntentWithRef: CreateTokenIntentWithBtRef,
    requestOptions?: RequestOptions
  ) => {
    if (!isNilOrEmpty(_elementErrors)) {
      throw new Error(
        'Unable to create token. Payload contains invalid values. Review elements events for more details.'
      );
    }

    try {
      const _token = replaceElementRefs<CreateTokenIntent>(tokenIntentWithRef);

      const token = await bt.tokenIntents.create(_token, requestOptions);

      return token;
    } catch (error) {
      console.error(error);
    }
  };

  return {
    create,
  };
};
