import { useEffect } from 'react';
import { _elementErrors, _elementValues, networkErrorKey, binLookupPendingKey } from '../../ElementValues';

export const useCleanupStateBeforeUnmount = (id: string) => {
  useEffect(() => {
    // cleans up state when component is unmounted
    return () => {
      delete _elementValues[id];
      delete _elementErrors[id];
      // Also clean up network error and bin lookup pending for card number elements
      delete _elementErrors[networkErrorKey(id)];
      delete _elementErrors[binLookupPendingKey(id)];
    };
  }, []);
};
