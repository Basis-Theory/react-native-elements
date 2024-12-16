import { BasisTheoryClient } from '@basis-theory/node-sdk';
import { logger } from '../utils/logging';
import { Sessions as SessionsClient } from '@basis-theory/node-sdk/api/resources/sessions/client/Client';

export const Sessions = (client: BasisTheoryClient) => {
  const create = async (
    requestOptions?: SessionsClient.RequestOptions,
    alternativeClient?: BasisTheoryClient
  ) => {
    if (alternativeClient) {
      client = alternativeClient;
    }

    try {
      const session = await client.sessions.create(requestOptions);

      await logger.log.info('Session created');

      return session;
    } catch (error) {
      await logger.log.error('Error while creating session', error as Error);
    }
  };

  return {
    create,
  };
};
