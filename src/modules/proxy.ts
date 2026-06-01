import type { ProxyRequestOptions, BasisTheoryInstance } from '../types';

import { replaceSensitiveData } from '../utils/dataManipulationUtils';

export const Proxy = (bt: BasisTheoryInstance) => {
  const proxy = async (
    {
      method,
      ...proxyRequest
    }: Omit<ProxyRequestOptions, 'includeResponseHeaders'> & {
      method: keyof BasisTheoryInstance['proxy'];
    },
    apiKey?: string
  ): Promise<unknown> => {
    try {
      // eslint-disable-next-line no-param-reassign
      proxyRequest.apiKey = apiKey;
      const proxyResponse = await bt.proxy[method](proxyRequest);
      const result = replaceSensitiveData(proxyResponse);

      return result;
    } catch (error) {
      console.error(error);
    }
  };

  return proxy;
};
