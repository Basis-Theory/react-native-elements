import { useEffect, useState } from 'react';
import { BasisTheoryClient } from '@basis-theory/node-sdk';

import { Sessions } from './modules/sessions';
import { Tokens } from './modules/tokens';
import { useBasisTheoryFromContext } from './BasisTheoryProvider';
import { logger } from './utils/logging';

const _BasisTheoryElements = async (options: BasisTheoryClient.Options) => {
  const client: BasisTheoryClient = new BasisTheoryClient(options);

  const sessions = Sessions(client);

  const tokens = Tokens(client);

  return {
    sessions,
    tokens,
  };
};

type BasisTheoryElements = Awaited<ReturnType<typeof _BasisTheoryElements>>;

type UseBasisTheory = {
  error?: Error;
  bt?: BasisTheoryElements;
};

const useBasisTheory = (options: BasisTheoryClient.Options): UseBasisTheory => {
  const [state, setState] = useState<UseBasisTheory>({});

  const { bt } = useBasisTheoryFromContext();

  if (!options.apiKey) {
    console.error('Please enter a valid API key');
  }

  useEffect(() => {
    (async () => {
      if (!state.bt && options.apiKey && !state.error) {
        try {
          const bt = await _BasisTheoryElements(options);

          await logger.log.info('Succesfully initialized Elements');

          setState({
            bt,
          });
        } catch (error) {
          await logger.log.error(
            'Error while initializing Elements',
            error as Error
          );

          setState({
            error: error as Error,
          });
        }
      }
    })();
  }, [state, options]);

  if (state.bt || state.error) {
    return {
      bt: state.bt,
      error: state.error,
    };
  }

  return {
    bt,
  };
};

export { useBasisTheory, type BasisTheoryElements };
