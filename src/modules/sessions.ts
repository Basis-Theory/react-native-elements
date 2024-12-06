import { BasisTheoryClient } from '@basis-theory/node-sdk';
import { logger } from '../utils/logging';

export const Sessions = (client: BasisTheoryClient) => {
  const create = async () => {
    try {
      const session = await client.sessions.create();

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
