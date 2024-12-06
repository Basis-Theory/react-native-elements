import {
  CreateTokenRequest,
  Token,
  UpdateTokenRequest,
} from '@basis-theory/node-sdk/api';
import type {
  BTRef,
  InputBTRefWithDatepart,
  PrimitiveType,
} from '../BaseElementTypes';
import { _elementErrors } from '../ElementValues';
import {
  replaceElementRefs,
  replaceSensitiveData,
} from '../utils/dataManipulationUtils';
import { logger } from '../utils/logging';
import { isNilOrEmpty } from '../utils/shared';
import { BasisTheoryClient } from '@basis-theory/node-sdk';
import { Tokens as TokenClient } from '@basis-theory/node-sdk/api/resources/tokens/client/Client';

export type CreateTokenWithBtRef = Omit<CreateTokenRequest, 'data'> & {
  data: Record<string, BTRef | InputBTRefWithDatepart | null | undefined>;
};

export type UpdateTokenWithBtRef = Omit<UpdateTokenRequest, 'data'> & {
  data: Record<
    string,
    BTRef | InputBTRefWithDatepart | string | null | undefined
  >;
};

export type TokenizeData =
  | BTRef
  | InputBTRefWithDatepart
  | PrimitiveType
  | unknown;

export const Tokens = (client: BasisTheoryClient) => {
  const getById = async (
    id: string,
    requestOptions?: TokenClient.RequestOptions,
    alternativeClient?: BasisTheoryClient
  ) => {
    if (alternativeClient) {
      client = alternativeClient;
    }

    try {
      const _token = await client.tokens.get(id, requestOptions);

      const token = replaceSensitiveData(_token) as Token;

      await logger.log.info(`Token retrieved ${id}`);

      return token;
    } catch (error) {
      await logger.log.error(
        `Error while retrieving Token ${id}`,
        error as Error
      );
    }
  };

  const create = async (
    tokenWithRef: CreateTokenWithBtRef,
    requestOptions?: TokenClient.IdempotentRequestOptions,
    alternativeClient?: BasisTheoryClient
  ) => {
    if (alternativeClient) {
      client = alternativeClient;
    }

    if (!isNilOrEmpty(_elementErrors)) {
      throw new Error(
        'Unable to create token. Payload contains invalid values. Review elements events for more details.'
      );
    }

    try {
      const _token = replaceElementRefs<CreateTokenRequest>(tokenWithRef);

      const token = await client.tokens.create(_token, requestOptions);

      await logger.log.info(`Token created: ${token.id}`);

      return token;
    } catch (error) {
      await logger.log.error('Error while creating Token', error as Error);
    }
  };

  const update = async (
    tokenId: string,
    tokenWithRef: UpdateTokenWithBtRef,
    requestOptions?: TokenClient.IdempotentRequestOptions,
    alternativeClient?: BasisTheoryClient
  ) => {
    if (alternativeClient) {
      client = alternativeClient;
    }

    if (!isNilOrEmpty(_elementErrors)) {
      throw new Error(
        'Unable to create token. Payload contains invalid values. Review elements events for more details.'
      );
    }

    try {
      const _token = replaceElementRefs<UpdateTokenRequest>(tokenWithRef);

      const token = await client.tokens.update(tokenId, _token, requestOptions);

      await logger.log.info(`Token updated: ${tokenId}`);

      return token;
    } catch (error) {
      await logger.log.error('Error while updating Token', error as Error);
    }
  };

  const deleteToken = async (
    id: string,
    requestOptions?: TokenClient.RequestOptions,
    alternativeClient?: BasisTheoryClient
  ) => {
    if (alternativeClient) {
      client = alternativeClient;
    }
    try {
      if (id) {
        await client.tokens.delete(id, requestOptions);

        await logger.log.info(`Token deleted: ${id}`);
      }
    } catch (error) {
      await logger.log.error('Error while deleting Token', error as Error);
    }
  };

  const tokenize = async (
    data: TokenizeData,
    requestOptions?: TokenClient.IdempotentRequestOptions,
    alternativeClient?: BasisTheoryClient
  ) => {
    if (alternativeClient) {
      client = alternativeClient;
    }

    try {
      if (data) {
        const _token = replaceElementRefs<TokenizeData>(data);

        return await client.tokens.tokenize(_token, requestOptions);
      }
    } catch (error) {
      await logger.log.error('Error while running tokenize', error as Error);
    }
  };

  return {
    getById,
    create,
    update,
    delete: deleteToken,
    tokenize,
  };
};
