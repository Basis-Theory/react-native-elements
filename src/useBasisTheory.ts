import { BasisTheory } from '@basis-theory/basis-theory-js';
import type {
  BasisTheoryInitOptionsWithoutElements,
  BasisTheory as BasisTheoryType,
} from '@basis-theory/basis-theory-js/types/sdk';
import { useEffect, useState } from 'react';

import { useBasisTheoryFromContext } from './BasisTheoryProvider';
import { Proxy } from './modules/proxy';
import { Sessions } from './modules/sessions';
import { TokenIntents } from './modules/tokenIntents';
import { Tokens } from './modules/tokens';

const _BasisTheoryElements = async ({
  apiKey,
  apiBaseUrl,
}: BasisTheoryInitOptionsWithoutElements & { apiKey: string }) => {
  const bt: BasisTheoryType = await new BasisTheory().init(
    apiKey,
    apiBaseUrl ? { apiBaseUrl } : undefined
  );

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
  options?: BasisTheoryInitOptionsWithoutElements
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
