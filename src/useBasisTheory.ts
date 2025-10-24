import { useEffect, useState } from 'react';

import { useBasisTheoryFromContext } from './BasisTheoryProvider';
import { Proxy } from './modules/proxy';
import { Sessions } from './modules/sessions';
import { TokenIntents } from './modules/tokenIntents';
import { Tokens } from './modules/tokens';
import { loadBasisTheoryInstance, getBasisTheoryInstance } from './services/basis-theory-js';
import type { BasisTheoryInstance } from './types';

interface BasisTheoryInitOptions {
  apiBaseUrl?: string;
  useNgApi?: boolean;
  debug?: boolean;
  useUat?: boolean;
}

const _BasisTheoryElements = async ({
  apiKey,
  apiBaseUrl,
  useNgApi,
  debug,
  useUat,
}: BasisTheoryInitOptions & { apiKey: string }) => {
  await loadBasisTheoryInstance(apiKey, apiBaseUrl, useNgApi, debug, useUat);
  
  const bt: BasisTheoryInstance = getBasisTheoryInstance();

  const proxy = Proxy(bt);

  const sessions = Sessions(bt);

  const tokens = Tokens(bt);

  const tokenIntents = TokenIntents(bt);

  return {
    proxy,
    sessions,
    tokenIntents,
    tokens,
  };
};

type BasisTheoryElements = Awaited<ReturnType<typeof _BasisTheoryElements>>;

type UseBasisTheory = {
  error?: Error;
  bt?: BasisTheoryElements;
};

const useBasisTheory = (
  apiKey: string,
  options?: BasisTheoryInitOptions
): UseBasisTheory => {
  const [state, setState] = useState<UseBasisTheory>({});

  const { bt } = useBasisTheoryFromContext();

  if (!apiKey) {
    // eslint-disable-next-line no-console
    console.error('Please enter a valid API key');
  }

  useEffect(() => {
    (async () => {
      if (!state.bt && apiKey && !state.error) {
        try {
          const bt = await _BasisTheoryElements({ apiKey, ...options });

          setState({
            bt,
          });
        } catch (error) {
          setState({
            error: error as Error,
          });
        }
      }
    })();
  }, [state, apiKey, options]);

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
